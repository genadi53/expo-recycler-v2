import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

const port = Number(process.env.PORT ?? 47821);
const host = process.env.HOST ?? "0.0.0.0";
const db = openDatabase();
const app = createApp(db);

serve({ fetch: app.fetch, port, hostname: host }, (info) => {
  console.log(`Recycler API listening on http://127.0.0.1:${info.port}`);
});
