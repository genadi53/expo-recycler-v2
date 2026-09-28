import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import {
  ensureImagesDir,
  openDatabase,
  resolveDatabasePath,
  resolveImagesDir,
  resolveItemImagesDir,
} from "./db.js";

const port = Number(process.env.PORT ?? 47821);
const host = process.env.HOST ?? "0.0.0.0";
const databasePath = resolveDatabasePath();
const imagesDir = ensureImagesDir(resolveImagesDir(databasePath));
const itemImagesDir = ensureImagesDir(resolveItemImagesDir(databasePath));
const db = openDatabase(databasePath);
const app = createApp(db, imagesDir, itemImagesDir);

serve({ fetch: app.fetch, port, hostname: host }, (info) => {
  console.log(`Recycler API listening on http://127.0.0.1:${info.port}`);
});
