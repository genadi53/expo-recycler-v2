# Recycler

A phone app for households who have something and do not know whether it can be reused or how to get rid of it. Search a shared catalog, follow a reuse idea or a plain disposal path, then log what you actually did. Points, badges, and a leaderboard stay with an anonymous display name stored on the phone.

There is no account, no camera scanning, no admin review, and no carbon estimate. Disposal guidance is general, not a map of local facilities. New items and ideas publish immediately.

## Run it

Use two terminals from this folder.

### API

```bash
cd server
npm install
npm start
```

The API listens on [http://127.0.0.1:47821](http://127.0.0.1:47821). On startup it creates `server/data/recycler.db` and, if the database is empty, seeds categories and items (banana peels, coffee grounds, jars, cans, and the rest). Set `PORT` to move it. Check the API with `npm test` inside `server/`.

### App

```bash
cd mobile
npm install
npm run web
```

Open [http://127.0.0.1:47822](http://127.0.0.1:47822). The app calls the API at `http://127.0.0.1:47821`. Override that with `EXPO_PUBLIC_API_URL` if the API is elsewhere.

On a wide browser window the app stays in a centered column so it still reads as a phone. The same Expo project can run on iOS and Android with `npm start` inside `mobile/`.

## What you can do

- Tabs: Dashboard, Log, Submit (the round button), Leaderboard, and Settings.
- Search, or browse Food, Plastic, Metal, Glass, Paper, and Other.
- On an item, read reuse ideas and a short “rather just get rid of it” path.
- Log “I reused this” or “I disposed of this.” Each record is its own event.
- Open a personal log of points, badges, and recent actions.
- Settings is a grouped list. Account is where you set or change the display name. The other rows open placeholder screens that say they are under construction.
- Open the leaderboard. It is friendly competition, not a verified ranking.
- Submit an item or an idea. A matching name gets the idea; a new name becomes an item.

Points: reuse 10, responsible disposal 5, trash 2, idea on an existing item 15, new item 25.
