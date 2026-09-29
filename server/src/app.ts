import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { addPoints, awardBadges, profileStats, type UnlockedBadge } from "./badges.js";
import { nowIso, parseStringArray, uniqueItemId, withTransaction, type DB } from "./db.js";
import {
  DISPOSAL_METHODS,
  EXISTING_ITEM_POINTS,
  IDEA_KINDS,
  METHOD_LABEL,
  NEW_ITEM_POINTS,
  REUSE_POINTS,
  disposalPoints,
  type DisposalMethod,
} from "./rules.js";

const IMAGE_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type ImageMime = keyof typeof IMAGE_MIME;

const MAX_IMAGE_BYTES = Math.floor(1.5 * 1024 * 1024);

export class HttpError extends Error {
  constructor(
    readonly status: 400 | 404,
    message: string,
  ) {
    super(message);
  }
}

const displayNameSchema = z.string().trim().min(1, "Display name is required.").max(40, "Display name is too long.");

const imagePayloadSchema = z.object({
  mime: z.enum(["image/jpeg", "image/png", "image/webp"], { error: "Picture must be a JPEG, PNG, or WebP." }),
  data: z.string().min(1, "Picture data is required."),
});

const submissionSchema = z
  .object({
    profileId: z.string().trim().min(1, "Profile id is required.").max(80, "Profile id is too long."),
    category: z.string().trim().min(1, "Category is required.").max(40),
    itemName: z.string().trim().min(1, "Item name is required.").max(80, "Item name is too long."),
    ideaKind: z.enum(IDEA_KINDS, { error: "Pick a kind: cook, beauty, art, or useful." }).optional(),
    title: z.string().trim().max(120, "Title is too long.").optional(),
    materials: z.string().trim().max(2000, "Materials are too long.").optional(),
    steps: z
      .union([z.string(), z.array(z.string())])
      .optional(),
    disposalNote: z.string().optional(),
    image: imagePayloadSchema.optional(),
    itemImage: imagePayloadSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasIdea = submissionHasIdea(value);
    if (!hasIdea) return;
    if (!value.ideaKind) {
      ctx.addIssue({ code: "custom", message: "Pick a kind: cook, beauty, art, or useful.", path: ["ideaKind"] });
    }
    if (!value.title?.trim()) {
      ctx.addIssue({ code: "custom", message: "Title is required.", path: ["title"] });
    }
    if (!value.materials?.trim()) {
      ctx.addIssue({ code: "custom", message: "Materials are required.", path: ["materials"] });
    }
    if (!stepsProvided(value.steps)) {
      ctx.addIssue({ code: "custom", message: "Steps are required.", path: ["steps"] });
    }
  });

const logSchema = z
  .object({
    profileId: z.string().trim().min(1, "Profile id is required.").max(80),
    itemId: z.string().trim().min(1, "Item is required.").max(80),
    action: z.enum(["reuse", "dispose"], { error: "Action must be reuse or dispose." }),
    ideaId: z.string().trim().min(1).max(80).optional(),
    method: z.enum(DISPOSAL_METHODS, { error: "Pick a disposal method." }).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "reuse" && !value.ideaId) {
      ctx.addIssue({ code: "custom", message: "Pick an idea to log a reuse.", path: ["ideaId"] });
    }
    if (value.action === "dispose" && !value.method) {
      ctx.addIssue({ code: "custom", message: "Pick a disposal method.", path: ["method"] });
    }
  });

function zodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

function stepsProvided(steps: string | string[] | undefined): boolean {
  if (steps == null) return false;
  if (Array.isArray(steps)) return steps.some((step) => step.trim().length > 0);
  return steps.trim().length > 0;
}

/** Idea fields are recipe-only. Blank strings from older clients count as absent. */
function submissionHasIdea(value: {
  ideaKind?: string;
  title?: string;
  materials?: string;
  steps?: string | string[];
}): boolean {
  return (
    value.ideaKind != null ||
    (value.title != null && value.title.length > 0) ||
    (value.materials != null && value.materials.length > 0) ||
    stepsProvided(value.steps)
  );
}


async function readJson(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON.");
  }
}

function normalizeSteps(value: string | string[]): string[] {
  const parts = Array.isArray(value) ? value : value.split(/\n+/);
  const steps = parts.map((step) => step.trim()).filter(Boolean);
  if (steps.length === 0) throw new HttpError(400, "Steps are required.");
  if (steps.join("\n").length > 4000) throw new HttpError(400, "Steps are too long.");
  return steps;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

type ItemRow = {
  id: string;
  name: string;
  aliases: string;
  category_id: string;
  summary: string;
  image_filename: string | null;
  status: string;
  created_at: string;
};

type IdeaRow = {
  id: string;
  item_id: string;
  kind: string;
  title: string;
  materials: string;
  steps: string;
  image_filename: string | null;
  author_profile_id: string | null;
  status: string;
  author_name: string | null;
};

function decodeIdeaImage(image: { mime: ImageMime; data: string }): { buffer: Buffer; ext: string; mime: ImageMime } {
  const cleaned = image.data.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
  if (!cleaned) throw new HttpError(400, "Picture data is required.");
  let buffer: Buffer;
  try {
    buffer = Buffer.from(cleaned, "base64");
  } catch {
    throw new HttpError(400, "Picture data is invalid.");
  }
  if (buffer.length === 0) throw new HttpError(400, "Picture data is required.");
  if (buffer.length > MAX_IMAGE_BYTES) throw new HttpError(400, "Picture is too large. Keep it under 1.5 MB.");
  return { buffer, ext: IMAGE_MIME[image.mime], mime: image.mime };
}

function ideaImageUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `/idea-images/${filename}`;
}

function itemImageUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `/item-images/${filename}`;
}

function contentTypeForFilename(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return null;
}

function serveImageFile(imagesDir: string, raw: string): Response {
  const file = path.basename(raw);
  if (!file || file !== raw || file.includes("..")) throw new HttpError(404, "Not found.");
  const contentType = contentTypeForFilename(file);
  if (!contentType) throw new HttpError(404, "Not found.");
  const fullPath = path.join(imagesDir, file);
  if (!fullPath.startsWith(path.resolve(imagesDir) + path.sep) && fullPath !== path.resolve(imagesDir)) {
    throw new HttpError(404, "Not found.");
  }
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) throw new HttpError(404, "Not found.");
  const body = fs.readFileSync(fullPath);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

type DisposalRow = {
  method: string;
  title: string;
  steps: string;
};

function requireProfile(db: DB, profileId: string): { id: string; display_name: string; points: number } {
  const profile = db.prepare("SELECT id, display_name, points FROM profiles WHERE id = ?").get(profileId) as
    | { id: string; display_name: string; points: number }
    | undefined;
  if (!profile) throw new HttpError(404, "Create a profile before doing that.");
  return profile;
}

function findCategory(db: DB, key: string) {
  return db.prepare("SELECT id, name, description FROM categories WHERE id = ? OR lower(name) = lower(?)").get(key, key) as
    | { id: string; name: string; description: string }
    | undefined;
}

function publicItem(row: ItemRow, categoryName: string) {
  return {
    id: row.id,
    name: row.name,
    aliases: parseStringArray(row.aliases),
    categoryId: row.category_id,
    categoryName,
    summary: row.summary,
    imageUrl: itemImageUrl(row.image_filename),
    status: row.status,
  };
}

function loadDisposal(db: DB, item: ItemRow) {
  const own = db
    .prepare("SELECT method, title, steps FROM disposals WHERE item_id = ?")
    .get(item.id) as DisposalRow | undefined;
  if (own) return { row: own, source: "item" as const };
  const fallback = db
    .prepare("SELECT method, title, steps FROM disposals WHERE item_id IS NULL AND category_id = ?")
    .get(item.category_id) as DisposalRow | undefined;
  if (fallback) return { row: fallback, source: "category" as const };
  return null;
}

function logMethods(method: DisposalMethod | null) {
  const methods: DisposalMethod[] = [];
  if (method) methods.push(method);
  if (method !== "trash") methods.push("trash");
  return methods.map((entry) => ({
    method: entry,
    label: METHOD_LABEL[entry],
    points: disposalPoints(entry),
    recommended: entry === method,
  }));
}

function profilePayload(db: DB, profileId: string) {
  const profile = db.prepare("SELECT id, display_name, points FROM profiles WHERE id = ?").get(profileId) as
    | { id: string; display_name: string; points: number }
    | undefined;
  if (!profile) throw new HttpError(404, "No profile with that id.");

  const stats = profileStats(db, profileId);
  const badges = db
    .prepare(
      `SELECT b.slug, b.title, b.rule, pb.unlocked_at AS unlockedAt
       FROM badges b
       LEFT JOIN profile_badges pb ON pb.badge_slug = b.slug AND pb.profile_id = ?
       ORDER BY b.sort_order`,
    )
    .all(profileId) as { slug: string; title: string; rule: string; unlockedAt: string | null }[];

  const recent = db
    .prepare(
      `SELECT l.id, l.action, l.disposal_method AS method, l.points_awarded AS pointsAwarded, l.created_at AS createdAt,
              i.id AS itemId, i.name AS itemName, c.name AS categoryName, ideas.title AS ideaTitle
       FROM log_entries l
       JOIN items i ON i.id = l.item_id
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN ideas ON ideas.id = l.idea_id
       WHERE l.profile_id = ?
       ORDER BY l.created_at DESC, l.rowid DESC
       LIMIT 20`,
    )
    .all(profileId);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 366);
  const sinceIso = since.toISOString();

  const activity = (
    db
      .prepare(
        `SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count
         FROM log_entries
         WHERE profile_id = ? AND created_at >= ?
         GROUP BY substr(created_at, 1, 10)
         ORDER BY date`,
      )
      .all(profileId, sinceIso) as { date: string; count: number }[]
  ).map((row) => ({ date: row.date, count: Number(row.count) }));

  const byCategory = (
    db
      .prepare(
        `SELECT c.id, c.name, COUNT(*) AS count
         FROM log_entries l
         JOIN items i ON i.id = l.item_id
         JOIN categories c ON c.id = i.category_id
         WHERE l.profile_id = ?
         GROUP BY c.id, c.name
         ORDER BY count DESC, c.name ASC`,
      )
      .all(profileId) as { id: string; name: string; count: number }[]
  ).map((row) => ({ id: row.id, name: row.name, count: Number(row.count) }));

  return {
    id: profile.id,
    displayName: profile.display_name,
    points: Number(profile.points),
    counts: {
      reuses: stats.reuses,
      disposals: stats.disposals,
      ideasShared: stats.ideas,
      logs: stats.logs,
    },
    activity,
    byCategory,
    badges,
    recent,
  };
}

function readDisplayName(body: unknown): string {
  const raw = typeof body === "string" ? body : (body as { displayName?: unknown } | null)?.displayName;
  const parsed = displayNameSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
  return parsed.data;
}

export function createApp(db: DB, imagesDir: string, itemImagesDir = imagesDir) {
  const app = new Hono();
  app.use("*", cors());
  app.use("*", async (c, next) => {
    const started = Date.now();
    await next();
    console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - started}ms`);
  });

  app.onError((error, c) => {
    if (error instanceof HttpError) return c.json({ error: error.message }, error.status);
    console.error(error);
    return c.json({ error: "Something went wrong on the server." }, 500);
  });

  app.notFound((c) => c.json({ error: "Not found." }, 404));

  app.get("/idea-images/:file", (c) => serveImageFile(imagesDir, c.req.param("file")));
  app.get("/item-images/:file", (c) => serveImageFile(itemImagesDir, c.req.param("file")));

  app.get("/categories", (c) => {
    const categories = db
      .prepare(
        `SELECT c.id, c.name, c.description, COUNT(i.id) AS itemCount
         FROM categories c
         LEFT JOIN items i ON i.category_id = c.id AND i.status = 'published'
         GROUP BY c.id
         ORDER BY c.rowid`,
      )
      .all();
    return c.json({ categories });
  });

  app.get("/items", (c) => {
    const q = (c.req.query("q") ?? "").trim();
    const category = (c.req.query("category") ?? "").trim();
    const params: string[] = [];
    let sql = `
      SELECT i.id, i.name, i.summary, i.category_id AS categoryId, c.name AS categoryName, i.image_filename AS imageFilename
      FROM items i
      JOIN categories c ON c.id = i.category_id
      WHERE i.status = 'published'
    `;
    if (q) {
      const like = `%${escapeLike(q.toLowerCase())}%`;
      sql += ` AND (lower(i.name) LIKE ? ESCAPE '\\' OR lower(i.aliases) LIKE ? ESCAPE '\\')`;
      params.push(like, like);
    }
    if (category) {
      sql += ` AND (i.category_id = ? OR lower(c.name) = lower(?))`;
      params.push(category, category);
    }
    sql += " ORDER BY i.name COLLATE NOCASE";
    const items = (
      db.prepare(sql).all(...params) as {
        id: string;
        name: string;
        summary: string;
        categoryId: string;
        categoryName: string;
        imageFilename: string | null;
      }[]
    ).map((item) => ({
      id: item.id,
      name: item.name,
      summary: item.summary,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      imageUrl: itemImageUrl(item.imageFilename),
    }));
    return c.json({ items });
  });

  app.get("/ideas", (c) => {
    const kind = (c.req.query("kind") ?? "").trim();
    const limitRaw = Number(c.req.query("limit") ?? "0");
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : 0;
    if (kind && !(IDEA_KINDS as readonly string[]).includes(kind)) {
      throw new HttpError(400, "Pick a kind: cook, beauty, art, or useful.");
    }
    const params: string[] = [];
    let sql = `
      SELECT ideas.id, ideas.kind, ideas.title, ideas.materials, ideas.image_filename,
             ideas.created_at, i.id AS itemId, i.name AS itemName, c.name AS categoryName,
             profiles.display_name AS authorName
      FROM ideas
      JOIN items i ON i.id = ideas.item_id AND i.status = 'published'
      JOIN categories c ON c.id = i.category_id
      LEFT JOIN profiles ON profiles.id = ideas.author_profile_id
      WHERE ideas.status = 'published'
    `;
    if (kind) {
      sql += " AND ideas.kind = ?";
      params.push(kind);
    }
    sql += " ORDER BY ideas.created_at DESC, ideas.rowid DESC";
    if (limit) sql += ` LIMIT ${limit}`;
    const ideas = (
      db.prepare(sql).all(...params) as {
        id: string;
        kind: string;
        title: string;
        materials: string;
        image_filename: string | null;
        itemId: string;
        itemName: string;
        categoryName: string;
        authorName: string | null;
      }[]
    ).map((idea) => ({
      id: idea.id,
      kind: idea.kind,
      title: idea.title,
      materials: idea.materials,
      itemId: idea.itemId,
      itemName: idea.itemName,
      categoryName: idea.categoryName,
      authorName: idea.authorName,
      imageUrl: ideaImageUrl(idea.image_filename),
    }));
    return c.json({ ideas });
  });

  app.get("/items/:id", (c) => {
    const item = db.prepare("SELECT * FROM items WHERE id = ? AND status = 'published'").get(c.req.param("id")) as
      | ItemRow
      | undefined;
    if (!item) throw new HttpError(404, "No item with that id.");
    const category = db.prepare("SELECT name FROM categories WHERE id = ?").get(item.category_id) as
      | { name: string }
      | undefined;
    const ideas = (
      db
        .prepare(
          `SELECT ideas.*, profiles.display_name AS author_name
           FROM ideas
           LEFT JOIN profiles ON profiles.id = ideas.author_profile_id
           WHERE ideas.item_id = ? AND ideas.status = 'published'
           ORDER BY ideas.created_at, ideas.rowid`,
        )
        .all(item.id) as IdeaRow[]
    ).map((idea) => ({
      id: idea.id,
      kind: idea.kind,
      title: idea.title,
      materials: idea.materials,
      steps: parseStringArray(idea.steps),
      imageUrl: ideaImageUrl(idea.image_filename),
      authorName: idea.author_name,
    }));
    const disposal = loadDisposal(db, item);
    const method = disposal && (DISPOSAL_METHODS as readonly string[]).includes(disposal.row.method)
      ? (disposal.row.method as DisposalMethod)
      : null;
    return c.json({
      item: publicItem(item, category?.name ?? ""),
      ideas,
      disposal: disposal
        ? {
            method: disposal.row.method,
            title: disposal.row.title,
            steps: parseStringArray(disposal.row.steps),
            source: disposal.source,
          }
        : null,
      logMethods: logMethods(method),
    });
  });

  app.put("/profiles/:id", async (c) => {
    const id = c.req.param("id").trim();
    if (!id || id.length > 80 || /\s/.test(id)) throw new HttpError(400, "Profile id is invalid.");
    const displayName = readDisplayName(await readJson(c));
    const existing = db.prepare("SELECT id FROM profiles WHERE id = ?").get(id);
    if (existing) {
      db.prepare("UPDATE profiles SET display_name = ? WHERE id = ?").run(displayName, id);
    } else {
      db.prepare("INSERT INTO profiles (id, display_name, points, created_at) VALUES (?, ?, 0, ?)").run(
        id,
        displayName,
        nowIso(),
      );
    }
    const profile = db.prepare("SELECT id, display_name, points FROM profiles WHERE id = ?").get(id) as {
      id: string;
      display_name: string;
      points: number;
    };
    return c.json({
      id: profile.id,
      displayName: profile.display_name,
      points: Number(profile.points),
      created: !existing,
    });
  });

  app.get("/profiles/:id", (c) => c.json(profilePayload(db, c.req.param("id"))));

  app.get("/leaderboard", (c) => {
    const profileId = (c.req.query("profileId") ?? "").trim();
    const ranked = db
      .prepare(
        `SELECT id, display_name AS displayName, points,
                ROW_NUMBER() OVER (ORDER BY points DESC, created_at ASC, rowid ASC) AS rank
         FROM profiles`,
      )
      .all() as { id: string; displayName: string; points: number; rank: number }[];

    const leaders = ranked.slice(0, 25).map((row) => ({
      rank: Number(row.rank),
      displayName: row.displayName,
      points: Number(row.points),
      isYou: profileId !== "" && row.id === profileId,
    }));
    const mine = profileId ? ranked.find((row) => row.id === profileId) : undefined;
    return c.json({
      leaders,
      you: mine
        ? { rank: Number(mine.rank), displayName: mine.displayName, points: Number(mine.points) }
        : null,
    });
  });

  app.post("/logs", async (c) => {
    const parsed = logSchema.safeParse(await readJson(c));
    if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
    const body = parsed.data;

    const result = withTransaction(db, () => {
      requireProfile(db, body.profileId);
      const item = db.prepare("SELECT id FROM items WHERE id = ? AND status = 'published'").get(body.itemId);
      if (!item) throw new HttpError(404, "No item with that id.");

      let points = 0;
      let ideaId: string | null = null;
      let method: string | null = null;
      if (body.action === "reuse") {
        const idea = db
          .prepare("SELECT id FROM ideas WHERE id = ? AND item_id = ? AND status = 'published'")
          .get(body.ideaId ?? "", body.itemId);
        if (!idea) throw new HttpError(400, "That idea is not on this item.");
        ideaId = body.ideaId ?? null;
        points = REUSE_POINTS;
      } else {
        method = body.method ?? null;
        points = disposalPoints(body.method as DisposalMethod);
      }

      const id = crypto.randomUUID();
      db.prepare(
        `INSERT INTO log_entries (id, profile_id, item_id, action, idea_id, disposal_method, points_awarded, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, body.profileId, body.itemId, body.action, ideaId, method, points, nowIso());
      const total = addPoints(db, body.profileId, points);
      const badgesUnlocked: UnlockedBadge[] = awardBadges(db, body.profileId);
      return { id, pointsAwarded: points, points: total, badgesUnlocked };
    });

    return c.json(result, 201);
  });

  app.post("/submissions", async (c) => {
    const parsed = submissionSchema.safeParse(await readJson(c));
    if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
    const body = parsed.data;
    const withIdea = submissionHasIdea(body);
    const steps = withIdea ? normalizeSteps(body.steps!) : null;
    const disposalNote = body.disposalNote?.trim() ?? "";
    const decodedImage = body.image ? decodeIdeaImage(body.image) : null;
    const decodedItemImage = body.itemImage ? decodeIdeaImage(body.itemImage) : null;

    if (!withIdea && decodedImage) {
      throw new HttpError(400, "An idea picture needs an idea. Add a recipe, or omit the picture.");
    }

    const result = withTransaction(db, () => {
      requireProfile(db, body.profileId);
      const category = findCategory(db, body.category);
      if (!category) throw new HttpError(400, "Pick a category from the list.");

      const existing = db.prepare("SELECT * FROM items WHERE lower(name) = lower(?)").get(body.itemName) as
        | ItemRow
        | undefined;
      let itemId: string;
      let createdItem = false;
      let points = EXISTING_ITEM_POINTS;
      let itemImageFilename: string | null = null;

      if (existing) {
        if (!withIdea) {
          throw new HttpError(400, "That item already exists. Add a recipe to it instead.");
        }
        itemId = existing.id;
        itemImageFilename = existing.image_filename;
      } else {
        itemId = uniqueItemId(db, body.itemName);
        const summary = withIdea ? body.title!.trim() : body.itemName.trim();
        itemImageFilename = decodedItemImage ? `${itemId}.${decodedItemImage.ext}` : null;
        db.prepare(
          `INSERT INTO items (id, name, aliases, category_id, summary, image_filename, status, created_at)
           VALUES (?, ?, '[]', ?, ?, ?, 'published', ?)`,
        ).run(itemId, body.itemName, category.id, summary, itemImageFilename, nowIso());
        createdItem = true;
        points = NEW_ITEM_POINTS;
        if (disposalNote) {
          const fallback = db
            .prepare("SELECT method, title FROM disposals WHERE item_id IS NULL AND category_id = ?")
            .get(category.id) as { method: string; title: string } | undefined;
          const method = fallback?.method ?? "trash";
          const title = fallback?.title ?? "Disposal note";
          db.prepare(
            "INSERT INTO disposals (id, item_id, category_id, method, title, steps) VALUES (?, ?, ?, ?, ?, ?)",
          ).run(
            `disposal-${itemId}`,
            itemId,
            category.id,
            method,
            title,
            JSON.stringify([disposalNote, "Check the rules where you live before you rely on this."]),
          );
        }
        if (decodedItemImage && itemImageFilename) {
          fs.writeFileSync(path.join(itemImagesDir, itemImageFilename), decodedItemImage.buffer);
        }
      }

      let idea:
        | { id: string; title: string; imageUrl: string | null }
        | null = null;

      if (withIdea) {
        const ideaId = crypto.randomUUID();
        const imageFilename = decodedImage ? `${ideaId}.${decodedImage.ext}` : null;
        db.prepare(
          `INSERT INTO ideas (id, item_id, kind, title, materials, steps, image_filename, author_profile_id, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
        ).run(
          ideaId,
          itemId,
          body.ideaKind!,
          body.title!.trim(),
          body.materials!.trim(),
          JSON.stringify(steps),
          imageFilename,
          body.profileId,
          nowIso(),
        );

        if (decodedImage && imageFilename) {
          fs.writeFileSync(path.join(imagesDir, imageFilename), decodedImage.buffer);
        }
        idea = { id: ideaId, title: body.title!.trim(), imageUrl: ideaImageUrl(imageFilename) };
      }

      const total = addPoints(db, body.profileId, points);
      const badgesUnlocked = awardBadges(db, body.profileId);
      const item = db.prepare("SELECT name, category_id, image_filename FROM items WHERE id = ?").get(itemId) as {
        name: string;
        category_id: string;
        image_filename: string | null;
      };
      const itemCategory = db.prepare("SELECT name FROM categories WHERE id = ?").get(item.category_id) as {
        name: string;
      };
      return {
        item: {
          id: itemId,
          name: item.name,
          categoryId: item.category_id,
          categoryName: itemCategory.name,
          created: createdItem,
          imageUrl: itemImageUrl(item.image_filename),
        },
        idea,
        pointsAwarded: points,
        points: total,
        badgesUnlocked,
      };
    });

    return c.json(result, 201);
  });

  return app;
}
