# Build an Ingredient list, see Matches, follow an Idea step by step

Terms follow `GLOSSARY.md` (Item, Ingredient, Ingredient list, Key Ingredient, Basics, Idea, Match, Make it now / Almost there / Save for later, Start making). The data decision is recorded in `docs/adr/0001-ideas-list-their-ingredients-as-items.md`.

## Problem Statement

Againful answers "I have this one item, what can I do with it?", but not "here is what I have, what can I make?". The browse screen searches one Item at a time or walks a Category to one Item. An Idea links to a single Item and lists everything else as free text, so the app can't say "you have 3 of the 4 things this needs, you're only missing eggs". The Idea's steps are only shown as a block of text on the Item screen. Home's "Explore recipes" shows kitchen Ideas only, although Ideas now come in six kinds.

## Solution

1. **Ingredient list builder** replaces the browse screen ("Rescue an item" on home opens it). The person searches with type-ahead, taps popular Ingredients, or opens a material Category in a bottom sheet and taps Items to add them. Picked Ingredients show as removable chips. "Find what I can make →" opens Matches.
2. **Matches** shows every Idea, of any kind, that uses at least one Ingredient from the list. The Ideas are grouped as **Make it now** (nothing missing), **Almost there** (one missing) and **Save for later** (two or more missing).
3. **Idea detail** (a new screen) shows the Ingredient checklist (in your list / missing), the Basics as "You'll also need…", the steps, and a **Start making** button.
4. **Start making** shows one step at a time with progress. The last step's button, "I made it", opens the existing log-a-reuse action.
5. **Explore ideas**: home's "Explore recipes" card becomes "Explore ideas" and opens all six kinds with a kind filter.
6. **Data**: an Idea now lists its Key Ingredients as linked Items (its own Item is always one of them). The share-an-idea form gets an optional Key Ingredient picker. **All existing Ideas are deleted** (no backup), the seed stops creating Ideas, and log entries and points are kept.

### Visual direction (decided from a throwaway prototype)

All screens use the **Bold block** language from the home redesign, with existing theme tokens and the `serif` stack only. No new colors.

- **Builder.** A `greenDark` hero card (large radius, subtle `green` corner ring) with the serif headline "What do you *have at home?*" (the last words in italic `greenSoft`), a `greenSoft` subline, and a `card` search field. Type-ahead results drop down inside the hero as `card` rows with a bold matched prefix and a `green` ＋. Below the hero: "Your list · N" with "Clear", then `greenSoft` chips with ✕. Then "Popular" as outlined `card` chips with ＋, then "Browse by material" as a two-column grid of `card` tiles (Category accent letter tile, name, item count). Then "Can't find it? **Suggest it →**". A docked full-width `green` button reads "Find what I can make →".
- **Category sheet.** Tapping a material tile opens a bottom sheet over the builder that lists that Category's Items. Tapping one adds it to the list (✓ when it's already there) and tapping again removes it. The builder underneath never changes route.
- **Matches.** A `greenDark` summary card ("N ideas / from M ingredients") with an "Edit list" pill that goes back to the builder. Each tier has a colored dot heading (`green` for Make it now, `terra` for Almost there, `muted` for Save for later) and a count. Cards are `card` with a soft shadow, a square image (or a kind-accent fallback with the kind icon), a kind pill, a serif title, and a meta line: **"✓ 3/4"** in `green`, then "Need Eggs" in `terra` when something is missing.
- **Idea detail.** A full-bleed image (or kind-accent fallback) with a floating back button. A `bg` sheet with a large top radius overlaps it and holds the kind pill, the serif title, and "From <Item>". Next comes an Ingredients `card` with "3 of 4 in your list": a `green` check for each Ingredient in the list, and a `terraSoft`/`terra` "!" plus "Missing" for each one that isn't. Under it, in muted text: "You'll also need: …" (the free-text `materials`). **Steps use the Basket tray style:** each step is a `card` row with a `line` border, a bold `green` number and the text. A docked `green` button reads "▶ Start making".
- **Start making.** Top row: a close button and "Step X of N". Below it, one segment per step (`green` when done or current, `line` otherwise). The main card is the Bold block `greenDark` one, with a large serif step number in `greenSoft`, the step text in serif `card`, a `green` corner ring, and the Ingredients that step mentions as `green` chips if any can be shown. Beneath it is the **Basket tray "Next" card**: a faded `card` with "**Next ·** <next step>". The docked buttons are an outlined "‹ Back" and a filled "Next step →". On the last step the filled button becomes "I made it".

## User Stories

1. As a person with leftovers, I want to add several things I have at home to one list, so that I can see everything I can make from them together.
2. As a person typing an Ingredient, I want matching catalog Items to appear as I type, so that I can add them in one tap.
3. As a person who doesn't know what to type, I want popular Ingredients offered as one-tap chips, so that I can start without typing.
4. As a person who thinks in materials, I want to open a Category and tap Items to add them, without leaving the builder.
5. As a person who added something by mistake, I want to remove a chip with ✕, or clear the whole list.
6. As a person whose Ingredient isn't in the catalog, I want "Can't find it? Suggest it" to open the existing add-item flow.
7. As a person who hasn't picked anything yet, I want the find button disabled with a hint, so that I don't land on an empty page.
8. As a person switching tabs or going back and forth between screens, I want my Ingredient list to still be there, so that I don't have to rebuild it.
9. As a person who closes the app completely, I expect a fresh, empty list next time. The list is temporary.
10. As a person viewing Matches, I want Ideas I can make right now listed first, then ones missing one thing, then ones missing more.
11. As a person viewing a Match, I want to see "✓ 3/4" and which Ingredient is missing, so that I can decide quickly.
12. As a person viewing Matches, I want Ideas of every kind (kitchen, beauty, cleaning, garden, home, crafts), not only food.
13. As a person with no Matches, I want a friendly empty state with "Share the first idea →".
14. As a person viewing Matches, I want "Edit list" to take me back to my list as I left it.
15. As a person opening an Idea, I want a checklist showing which Ingredients I have and which are missing, plus the Basics it assumes.
16. As a person ready to make it, I want "Start making" to show one step at a time with clear progress, and to show what comes next.
17. As a person who has finished, I want "I made it" to log the reuse with points and badges as today.
18. As a person on home, I want "Explore ideas" to show every kind of Idea, with a way to filter by kind.
19. As a person sharing an Idea, I want to optionally pick its Key Ingredients from the catalog, with the Idea's own Item already included and locked.
20. As a screen-reader user, I want each Match card announced as "<title>, <kind>, has 3 of 4, missing eggs", each chip announced as "<name>, remove", and the step screen announced as "Step 2 of 4".
21. As a Bulgarian user, I want every new string localized. As an en-GB user, I want the same copy as en-US.

## Implementation Decisions

**Server**

- New link table: an Idea **needs** Items (idea id, item id, unique pair). On creating an Idea, its own Item is always inserted as a link.
- Migration: delete all rows in `ideas` and the new link table, delete the files in the idea-images directory, and set `log_entries.idea_id` to null. Log entries and profile points stay. **No backup.** Run it once on startup behind a marker, like the idea-kinds migration.
- Seed: stop creating Ideas. The 13 Items, Categories and disposals stay.
- `GET /matches?items=a,b,c` returns published Ideas that link at least one of the given Items. For each Idea it returns `have`, `need`, the `missing` Item names, the Idea summary fields, and a `tier` (`now` | `almost` | `later`). Sorting is by tier, then by `have` descending, then by newest.
- `GET /ideas/:id` returns one Idea with its item, kind, steps, materials text, image and linked Ingredients (id, name).
- `GET /ideas` loses nothing. Explore ideas calls it with an optional `kind`.
- `POST /submissions` accepts an optional `ingredientIds: string[]` (existing published Items) for an Idea. Unknown ids are rejected with 400. Duplicates and the own Item are ignored.
- `GET /items?popular=1&limit=n` returns Items ordered by how many Ideas link them, for the builder's Popular chips.

**Mobile**

- **Ingredient list store.** An in-memory React context mounted in the root layout. It holds an ordered list of `{id, name}` and offers add, remove, toggle, clear and has. Nothing is written to storage, so it survives tab switches and navigation but not an app restart.
- **Builder screen** (replaces `browse.tsx` at the same route). It uses the existing `items({ q })` call for type-ahead (debounced), the popular-items call, and `categories()`. The Category bottom sheet uses `items({ category })`.
- **Matches screen** (new route `/matches`). It reads the store, calls `/matches`, and shows loading, error-with-retry, empty and ready states.
- **Idea detail screen** (new route `/idea/[id]`). It computes the checklist by comparing the linked Ingredients with the store.
- **Start making** (new route `/idea/[id]/make`, or a full-screen mode of the detail screen; the implementer chooses). "I made it" opens the existing `LogAction` reuse path for that Idea.
- **Explore ideas**: the recipes screen becomes all-kinds with a kind chip row (All plus six kinds from the idea-kinds registry). The home card's title and body are renamed.
- **Share form**: an optional Key Ingredient picker that reuses the builder's type-ahead and chips.
- i18n keys are added for en-US, en-GB and bg. The agent drafts the Bulgarian strings and flags them in the PR.

## Testing Decisions

- Server smoke tests cover: matches tiering (0, 1 and 2+ missing), sorting, Ideas that don't overlap the list being excluded, the own Item always being linked, rejecting unknown `ingredientIds`, the migration deleting Ideas while keeping log entries and points, and the seed creating no Ideas.
- Mobile: the store's add, remove, toggle and clear, and the builder's disabled state when the list is empty.

## Out of Scope

- Prep time, storage guidance and safety warnings on Ideas.
- "A or B" alternative Ingredient groups.
- Keeping the Ingredient list across app restarts, or syncing it to the server.
- Ranking by suitability beyond tier and overlap.
- An admin UI for linking Ingredients.

## Further Notes

- **Prototype (done).** A throwaway, phone-width HTML prototype compared Bold block, Editorial and Basket tray across the four screens. It is kept on the `prototype/ingredient-list` branch (`prototype-ingredient-list.html`), not on main. Verdict: Bold block everywhere, with Basket tray's bordered step cards on Idea detail and its faded "Next ·" card in Start making.
- **Day one is empty.** After the migration there are no Ideas, so home's Fresh ideas hides itself, and Explore ideas and Matches show "Share the first idea →".
- **Open question:** whether the home carousel cards and the Item screen's Idea cards should open the new Idea detail instead of the Item screen.
