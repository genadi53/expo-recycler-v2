## Problem Statement

Every idea in Againful carries a **kind** that says what the idea turns an item into. Today there are four kinds: `cook`, `beauty`, `art` and `useful`. They come from the pre-Againful prototype and no longer match the brand. The Againful brand sheet ("Turn expired food into useful solutions") presents six categories instead: **Kitchen, Beauty, Cleaning, Garden, Home, Crafts**.

The mismatch causes real problems:

- **`useful` is a catch-all.** Seed mulch, a funnel, packing cushions and a pantry jar all sit under one label that tells a browser nothing about where the idea will be used.
- **Missing categories.** Neither Cleaning nor Garden can be expressed, although both are central to the brand story (citrus-peel cleaners, coffee grounds in the garden).
- **The wrong words reach users.** The submit picker, recipe tiles, item pages, the log-action sheet and onboarding copy all show "Cook / Beauty / Art / Useful" in en-US, en-GB and bg.
- **The kind set is hard-coded in several places that must change together.** The database enforces it with a `CHECK (kind IN ('cook','beauty','art','useful'))` constraint on `ideas`. SQLite cannot alter a CHECK constraint in place. The live database on the Fly volume (`recycler-api`, `/data/recycler.db`) holds published seeded ideas and user submissions, log entries that reference those ideas, and idea images named after idea ids. All of it has to survive the change.
- **Old app builds will keep running.** Installed builds send `ideaKind: "cook"` and request `/ideas?kind=cook` (the Recipes screen and the home-screen recipe preview). Hard-cutting the API to new ids would break their recipe lists and their submissions.

## Solution

Replace the four idea kinds with the six brand categories: `kitchen`, `beauty`, `cleaning`, `garden`, `home` and `crafts`. Do it everywhere: the database constraint, seed data, API validation and filtering, mobile types, the submit picker, labels, icons and all three locales.

- **Migrate on boot.** The live database is migrated by an idempotent, transactional rebuild of the `ideas` table. The rebuild remaps every existing idea to a new kind. It preserves ids, row order, image filenames and every log entry reference. A point-in-time backup copy is written first.
- **Remap rules.** `cook→kitchen`, `beauty→beauty` and `art→crafts` map mechanically. `useful` ideas are split by hand for seeded content, keyed by their deterministic seeded idea ids. Any other `useful` idea (user submissions that cannot be hand-reviewed) falls back to `home`.
- **Keep old clients working.** The API accepts the old ids as **aliases** on `GET /ideas?kind=` and `POST /submissions` for a transition period, so installed older builds keep working. API responses always carry the new ids.
- **Mobile changes.** The app adopts the new ids. The submit picker shows six chips, each with an icon and an accent colour taken from existing theme tokens. The Recipes screen filters by `kitchen`.

## User Stories

1. As a browser, I want each idea labelled with one of six familiar categories (Kitchen, Beauty, Cleaning, Garden, Home, Crafts), so that I can tell at a glance where an idea will be used.
2. As a browser, I want the Recipes screen to list Kitchen ideas, so that the food ideas I used to find under "Cook" are still there.
3. As a browser, I want the home-screen recipe preview to show Kitchen ideas, so that the dashboard still offers something to cook.
4. As a browser, I want seed-starting pots and sheet mulch to appear under Garden, so that gardening reuse ideas are grouped together.
5. As a browser, I want household reuse ideas such as a pantry jar, a utensil crock or packing cushions to appear under Home, so that I can find practical ideas for around the house.
6. As a browser, I want the art projects I used to find under "Art", such as the punched-can lantern and the painted votive, to appear under Crafts, so that maker projects keep their own home.
7. As a browser, I want each category to have a distinct icon and accent, so that I can scan a list of ideas without reading every label.
8. As a browser, I want an item page to show the category of each idea in my language, so that the label matches the rest of the app.
9. As a browser, I want an empty category, such as Cleaning before anyone has shared one, to show a friendly empty state rather than an error, so that the app does not look broken.
10. As a browser, I want the colours of the app to stay exactly as they are, so that the Againful look I know does not shift.
11. As a submitter, I want the "Idea kind" picker on the Add recipe form to offer all six categories, so that I can file my idea where it belongs.
12. As a submitter, I want the picker to default to Kitchen, so that the most common case needs no extra tap.
13. As a submitter, I want the "Beauty use" shortcut in the create sheet to keep preselecting Beauty, so that the shortcut still does what its label says.
14. As a submitter, I want a clear, localized error if a kind is somehow missing or invalid, so that I know what to fix.
15. As a submitter, I want my previously shared ideas to keep their pictures, author credit and position after the change, so that my contributions do not disappear or shuffle.
16. As a submitter, I want my Contributor and Catalog gardener badges and my points to be unaffected, so that the change costs me nothing.
17. As a submitter following an old deep link or shortcut with `kind=cook` (or `art` / `useful`), I want the form to open with the matching new category preselected, so that stale links still work.
18. As a profile owner, I want my log entries that reference ideas to remain intact, so that my history, points and streak graph are unchanged.
19. As a Bulgarian user, I want the six categories shown in natural Bulgarian, so that the picker and tiles read as native copy.
20. As a Bulgarian user, I want onboarding and Recipes copy that mention idea kinds updated to the new categories, so that the text matches what I see in the picker.
21. As an en-GB user, I want the category labels in my locale as well, so that I never see a raw id.
22. As a user on an old app build, I want my Recipes screen (which asks for `kind=cook`) to keep listing food ideas, so that the app does not go empty after the server updates.
23. As a user on an old app build, I want submitting an idea with an old kind (`cook`, `beauty`, `art`, `useful`) to keep succeeding, so that I am not blocked until I update.
24. As a user on an old app build, I want ideas with new kinds to still render, even if the label shows the raw id, so that nothing crashes.
25. As a user on an old app build, I want filtering by the old `useful` kind to return the Cleaning, Garden and Home ideas, so that the closest equivalent of what I asked for still shows.
26. As the operator deploying the migration, I want it to run automatically on server boot, so that pushing `main` (which deploys `recycler-api` through the pre-push hook) is the whole rollout.
27. As the operator, I want the migration to be idempotent, so that restarts, redeploys and machine reschedules never re-run it destructively.
28. As the operator, I want the migration to run inside a single transaction, so that a failure leaves the database exactly as it was.
29. As the operator, I want a backup copy of the database written to the volume before the rebuild, so that I can restore by hand if something unexpected happens.
30. As the operator, I want the server to refuse to start (and log why) if the post-migration integrity or foreign key check fails, so that a corrupt state is never served silently.
31. As the operator, I want a one-line log stating how many ideas were remapped per old to new kind, so that I can confirm the result from `fly logs`.
32. As the operator, I want alias usage to be logged or counted, so that I can tell when old builds have faded and the aliases can be removed.
33. As the operator, I want fresh databases (local dev, smoke test) to be created directly with the new constraint and new seed kinds, so that the migration path is only exercised where it is needed.
34. As a developer, I want the kind list defined once on the server and once on mobile, with no scattered string literals, so that future category changes are one edit per app.
35. As a developer, I want the smoke test to cover migrating an old-schema database, so that the riskiest part of this change is tested before it reaches Fly.

## Implementation Decisions

### Vocabulary

- The domain term stays **idea kind** (DB column `kind`, API field `ideaKind`, query `?kind=`). "Category" already means the **item category** (food, plastic, metal, glass, paper, other) in the database, in the API (`/categories`, the `category` field on submissions) and in i18n (`category.*`). Renaming kind to "category" in code would collide with that.
- In user-facing copy, the six values are the brand's category names. The picker label keeps its current "Idea kind" / "Вид идея" wording; renaming it is optional copy polish.
- If a `GLOSSARY.md` is created later, record "idea kind = one of the six brand categories; distinct from item category".

### Kind set (server rules module and mobile types)

The server rules module owns the canonical list and the alias map. The mobile app mirrors the canonical list in one place, its shared types module, and derives the picker, labels, icons and accents from it.

```ts
type IdeaKind = "kitchen" | "beauty" | "cleaning" | "garden" | "home" | "crafts";
// display order = array order above

type LegacyIdeaKind = "cook" | "art" | "useful"; // "beauty" is unchanged
const SUBMIT_ALIAS: Record<LegacyIdeaKind, IdeaKind> = { cook: "kitchen", art: "crafts", useful: "home" };
const FILTER_ALIAS: Record<LegacyIdeaKind, IdeaKind[]> = {
  cook: ["kitchen"], art: ["crafts"], useful: ["cleaning", "garden", "home"],
};
```

The server exposes small helpers to the routes:

- "normalize a submitted kind": new id, or alias mapped to one new id, or invalid.
- "expand a filter kind": new id to itself, alias to a list of new ids, or invalid.

### Schema change

The `ideas` table's constraint becomes `CHECK (kind IN ('kitchen','beauty','cleaning','garden','home','crafts'))`. No other column, table or index changes. Badges are unaffected: no badge rule reads `ideas.kind` (`contributor` and `catalog-gardener` count ideas by author; `curious` counts item categories).

### Migration strategy (runs inside database open, on every boot)

1. **Order.** The existing additive column migrations (`image_filename` on ideas and items) run first, so an older database has every column before the rebuild. The kind migration runs next. Seeding runs last.
2. **Detection (idempotency).** Read the stored `CREATE TABLE` text for `ideas` from `sqlite_master`. If it already lists `'kitchen'`, do nothing. A fresh database is created by the new schema and is skipped automatically. Re-running after success is a no-op.
3. **Backup.** For a file-backed database, write `VACUUM INTO '<db dir>/recycler.pre-idea-kinds-<timestamp>.db'` on the same Fly volume before touching anything. Skip this for `:memory:`. This works with WAL mode. The backup is roughly the size of the database, which is small; the volume has room.
4. **Rebuild**, using SQLite's documented "make other kinds of table schema changes" procedure:
   - Disable foreign keys. This must happen outside a transaction, because log entries reference `ideas(id)`.
   - `BEGIN IMMEDIATE`.
   - Create `ideas_new` with the new CHECK and the same columns in the same order.
   - Run one `INSERT … SELECT` that copies **`rowid`** explicitly (the `/ideas` and `/items/:id` ordering uses `rowid` as a tie-breaker) along with every column. `kind` is computed in a `CASE`:
     - first, the per-id overrides for seeded `useful` ideas (table below);
     - then `cook→kitchen`, `beauty→beauty`, `art→crafts`, `useful→home`;
     - any value already in the new set is kept.
   - Before the drop, assert that the row counts of `ideas` and `ideas_new` are equal.
   - `DROP TABLE ideas`, then `ALTER TABLE ideas_new RENAME TO ideas`.
   - `PRAGMA foreign_key_check` must return no rows (log entries' `idea_id` still resolve). Otherwise roll back and throw.
   - `COMMIT`, then re-enable foreign keys.
   - On any error: roll back, re-enable foreign keys, rethrow. The process exits, Fly marks the machine unhealthy, and the old data is untouched.
5. **Images.** Idea image files are named `<ideaId>.<ext>` in the `idea-images` directory beside the database. Ids and `image_filename` are copied unchanged, so no file moves.
6. **Logging.** Emit one line such as `idea-kinds migration: cook→kitchen 9, art→crafts 7, useful→garden 2, useful→home 5+N, … backup at …`.
7. **Seed changes.** Seeding only runs on an empty database (`seedIfEmpty` checks `categories`), so seed edits never reach production. Update the seed's kinds to the new ids for fresh databases; production gets the same result through the per-id overrides. Seeded idea ids are deterministic (`<itemId>-idea-<n>`), which is what makes the overrides safe.

### Remap table for seeded ideas

Mechanical mappings: every `cook` idea becomes `kitchen` (banana peel bacon, savory coffee rub, candied citrus peel, shells in the stock pot, skillet croutons, stale-bread pudding, scrap broth). Every `beauty` idea stays `beauty` (peel rub, coffee body scrub, citrus sugar scrub, baked-shell hand scrub). Every `art` idea becomes `crafts`.

| Seeded idea id | Title | Old kind | New kind | Reason |
|---|---|---|---|---|
| `pet-bottles-idea-1` | Funnel from the neck | useful | **home** | General household tool (dry goods, watering) |
| `pet-bottles-idea-2` | Hanging bottle planter | art | **crafts** | Mechanical rule. Garden is arguable; kept as crafts to avoid a second override class |
| `plastic-bags-idea-1` | Packing cushions | useful | **home** | Storage and shipping around the house |
| `plastic-bags-idea-2` | Braided bag basket | art | crafts | |
| `yogurt-cups-idea-1` | Seed-starting pots | useful | **garden** | Seeds and soil |
| `yogurt-cups-idea-2` | Painted desk cups | art | crafts | |
| `aluminum-cans-idea-1` | Punched-can lantern | art | crafts | |
| `aluminum-cans-idea-2` | Workshop parts cup | useful | **home** | Workshop and household storage |
| `tin-cans-idea-1` | Utensil crock | useful | **home** | Storage object, not cooking. Kitchen considered and rejected, because Kitchen means food you make |
| `tin-cans-idea-2` | Painted desk caddy | art | crafts | |
| `glass-jars-idea-1` | Pantry jar | useful | **home** | Storage object, same reasoning as the utensil crock |
| `glass-jars-idea-2` | Painted votive | art | crafts | |
| `cardboard-idea-1` | Desk organizer | art | crafts | |
| `cardboard-idea-2` | Sheet mulch | useful | **garden** | Weed suppression in beds |

The override applies only when the row's id matches **and** its current kind is `useful`. If an operator ever hand-edited a seeded idea, the override does not clobber it.

**No seeded idea maps to Cleaning.** Cleaning launches empty. See Further Notes.

**Unreviewable user submissions:** every other idea with kind `useful`, meaning user-submitted ideas with random UUID ids, becomes **`home`**. This is a deterministic, lossy default: some of these are really cleaning or garden ideas. It is accepted here and flagged for an optional manual curation pass (Further Notes).

### API contract

- **`GET /ideas?kind=<k>`**
  - Accepts any new id.
  - Accepts the aliases `cook`, `art` and `useful`, which expand via the filter-alias map (`useful` → cleaning OR garden OR home).
  - `beauty` is both old and new.
  - Any other value is `400`, with a message listing the six new kinds.
  - Responses always contain new ids.
- **`POST /submissions`**
  - `ideaKind` accepts the six new ids and, as aliases, `cook→kitchen`, `art→crafts` and `useful→home`. The idea is stored under the new id.
  - The validation message names the six new categories.
  - The existing "blank idea fields mean item-only, no kind required" behaviour is unchanged.
- **`GET /items/:id` and the `/ideas` list:** `kind` is always one of the six new ids. No alias is ever emitted.
- **Old-client rendering:** old builds look the label up in their bundled i18n and fall back to the raw id (`kindLabel` returns the id when the key is missing). They therefore show "KITCHEN", "CLEANING" and so on, uppercased by tile styling, with no crash. Bulgarian users on old builds see English ids until they update. This is accepted.
- **Alias lifetime:** keep the aliases until alias-hit logging shows no traffic for a sustained period (suggest 60 days after the release that ships the new picker reaches stores and EAS Update). Removal is a separate issue, not part of this one.
- **No new endpoint:** both apps hard-code the six kinds. A server-driven kind list is not needed yet.

### Mobile

- **Shared types:** the `Idea.kind` union becomes the six new ids. `IdeaSummary.kind` follows it.
- **One kind registry module:** ordered ids, each with an Ionicons glyph and an accent colour. Suggested glyphs, to be confirmed in review:
  - kitchen `restaurant-outline`
  - beauty `sparkles-outline` (matches the existing "Beauty use" shortcut)
  - cleaning `water-outline`
  - garden `leaf-outline`
  - home `home-outline`
  - crafts `color-palette-outline`

  Accents reuse **existing** tokens only. No new hex values, and the theme does not change:
  - kitchen `terra`
  - beauty: the "other" item-category accent
  - cleaning: the "plastic" accent
  - garden `green`
  - home: the "paper" accent
  - crafts: the "glass" accent
- **Submit (Add recipe) form:** the picker renders all six from the registry as chips with icons. The default is `kitchen`. The route-param parser normalizes legacy `kind` params (`cook`, `art`, `useful`) through the same alias rules, with `useful→home`, so old links and shortcuts preselect the right chip.
- **Create sheet:** the "Beauty use" shortcut still routes with `kind=beauty`. No change beyond confirming the id.
- **Recipes screen and home recipe preview:** both query `kind=kitchen`. The home screen's current preview call is updated in this issue, because it exists today.
- **Labels:** the label formatter keeps its locale lookup and raw-id fallback. The deprecated kind-label proxy's type is updated to the new union, or the proxy is removed if it is unused.
- **Item page, recipe tile and log-action sheet:** they keep using the label formatter. They may show the category icon or accent beside the label (optional polish, same tokens).
- **i18n:** replace `kind.cook|beauty|art|useful` with six keys in en-US, en-GB and bg, and update kind-related copy (`recipes.lead`, `recipes.previewNote`, `recipes.emptyBody`, `onboarding.reuseFirstBody`). Draft strings:

| id | en-US / en-GB | bg (draft, needs native review) |
|---|---|---|
| kitchen | Kitchen | Кухня |
| beauty | Beauty | Красота |
| cleaning | Cleaning | Почистване |
| garden | Garden | Градина |
| home | Home | Дом |
| crafts | Crafts | Занаяти (alt: Ръкоделие) |

  Copy drafts:
  - `recipes.lead`: "Kitchen ideas from the shared catalog. Open one to see steps on the item." / bg: "Идеи за кухнята от споделения каталог. Отвори една, за да видиш стъпките на артикула."
  - `onboarding.reuseFirstBody`: "Follow a kitchen, beauty, cleaning, garden, home, or crafts idea. …" / bg: "Следвай идея за кухня, красота, почистване, градина, дом или занаяти. …"
  - The bg strings for `shortcuts.beautyUse` ("Beauty рецепта", which still contains English) should be fixed in the same review pass.

### Dependency: home-screen redesign (separate issue)

The home redesign plans a chips row of the four old kinds. **This issue owns that row's content**: once both have landed, the row shows the six categories from the kind registry and each chip routes to an `/ideas?kind=` view.

- If the redesign merges first, this issue updates its chips to the registry.
- If this issue merges first, the redesign consumes the registry directly.
- Neither issue assumes the other has merged.

## Testing Decisions

**What a good test is here:** tests exercise external behaviour, meaning HTTP responses from the app and the on-disk database state after opening, not private helpers. The server smoke test (`npm test` in `server/`, which runs the Hono app against a real SQLite database) is the highest existing seam. Extend it rather than adding a new harness.

Server smoke test additions:

1. **Fresh-database path:** `/ideas?kind=kitchen` returns at least 4 ideas, all with `kind === "kitchen"`. This replaces the current `kind=cook` assertion. `/ideas?kind=garden` includes "Seed-starting pots" and "Sheet mulch". `/ideas?kind=cleaning` returns `200` with an empty list. Every idea in `/ideas` (unfiltered) has a kind in the new set.
2. **Alias filter:**
   - `/ideas?kind=cook` returns the same ids as `kind=kitchen`.
   - `kind=art` matches `kind=crafts`.
   - `kind=useful` returns exactly the union of cleaning, garden and home.
   - `kind=snack` stays `400`.
3. **Submission validation:**
   - Submitting with `ideaKind: "garden"` creates an idea that `/items/:id` reports as `garden`.
   - `ideaKind: "cook"` is stored and reported as `kitchen`; `ideaKind: "useful"` as `home`.
   - `ideaKind: "snack"` is `400` with the new message.
   - Blank idea fields still mean item-only.
4. **Migration from an old-schema database.** Build a temporary file database with the **old** `ideas` CHECK, then insert:
   - the old seeded ideas (or a subset that includes every `useful` override id);
   - one user-submitted idea of each old kind (`cook`, `beauty`, `art`, `useful`), one of them with an `image_filename`;
   - a profile, and log entries that reference several ideas.

   Then open the file with the real database-open function and assert:
   - the stored `ideas` table SQL now lists the new kinds;
   - row count is unchanged and ids are unchanged;
   - each old kind maps as specified, including every override in the remap table and the `useful→home` default for the UUID idea;
   - `image_filename` is preserved and the image URL still resolves through `/items/:id`;
   - log entries still join to their ideas and `PRAGMA foreign_key_check` is empty;
   - `rowid` order is preserved;
   - a backup file exists beside the database;
   - opening the same file a **second time** is a no-op: no second backup, identical rows;
   - an old-schema database that lacks the `image_filename` column also migrates, which covers the column-migration ordering.
5. **Failure safety (optional but recommended):** force a failure mid-rebuild, for example by injecting a row the CHECK would reject via an unmapped kind. Assert the original table and data are intact and the open call throws.

Mobile has no test harness. Verify with:

- `npx tsc --noEmit`, which catches every leftover reference to the old union;
- `npx expo lint`;
- a manual walkthrough in en-US and bg:
  - submit picker shows six chips with icons; default is Kitchen;
  - "Beauty use" shortcut preselects Beauty;
  - a deep link with `kind=cook` preselects Kitchen;
  - Recipes screen and home preview list Kitchen ideas;
  - item page labels are localized;
  - the log-action sheet shows the localized kind;
  - onboarding copy is updated;
  - colours are visually unchanged.

Also spot-check an **old build** (the current store or EAS build) against the migrated server: Recipes populates, submitting an idea succeeds, new kinds render as raw ids without crashing.

Operator verification after deploy: `fly logs` shows the migration summary line once. The next restart shows no migration line. `GET /ideas?kind=kitchen` and `GET /ideas?kind=cook` both return data.

## Out of Scope

- Ingredient matching (finding ideas by what you have).
- A recipe-detail "Start making" step-by-step mode.
- The home-screen redesign itself. Only the content of its kind chips row is in scope, as described above.
- Any theme colour change or new colour token.
- Renaming item categories (food, plastic, …) or merging them with idea kinds.
- Removing the old-id aliases (a follow-up once alias traffic stops).
- Writing new seed content for Cleaning. Seeding does not reach production; content needs a separate curation or admin path.
- Manual re-categorization of user-submitted `useful` ideas.
- A server-driven kind list endpoint.

## Further Notes

- **Cleaning launches empty.** No existing idea maps to it. Every Cleaning surface must handle an empty list gracefully, which the Recipes-style empty state already does. Consider a follow-up to add a few curated Cleaning ideas (for example a citrus-peel vinegar cleaner, or coffee grounds as a pot scrub) through a production-safe path, plus a few Garden ideas (coffee grounds or eggshells for soil).
- **The `useful→home` default is lossy.** After deploy, the operator can list user-submitted ideas whose kind is `home` and whose author is not null, and re-file obvious Cleaning or Garden ones by hand with a one-off SQL update on the Fly volume. The data model allows it; no tooling is planned here.
- **Deployment.** The Fly app runs one machine with `min_machines_running = 1` and a single volume, so there is a brief restart during deploy anyway. The migration is milliseconds for a database this size, well inside the 15 s health-check grace period on `/categories`. The pre-migration backup stays on the volume and can be deleted manually once the deploy has proven healthy.
- **Rollback.** Rolling back the server code after the migration would fail to start (old code, new data), because old code's `CREATE TABLE IF NOT EXISTS` does not touch the table and inserts would accept only old kinds. A rollback therefore means stopping the machine and restoring the backup file in place of `recycler.db`, or shipping a forward fix. Prefer forward fixes.
- **Release order.** Ship the server first: aliases make it compatible with current clients. Then ship the mobile build or EAS update. The reverse order would have new clients sending `kitchen` to a server that rejects it.
- **ADR candidate.** "Schema changes to CHECK constraints use an on-boot, idempotent table rebuild with a pre-migration `VACUUM INTO` backup" is the first non-additive migration in this repo and is worth recording under `docs/adr/`.
- **Bulgarian strings are drafts.** Flag them for native review, especially Crafts ("Занаяти" vs "Ръкоделие") and Home ("Дом" vs "За дома").
- **README.** It describes Recipes as "cook ideas from the catalog" and should be updated to "Kitchen ideas".
