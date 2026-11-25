# Redesign the Dashboard tab as a profile-independent home; move personal stats to a new "My impact" screen

## Problem Statement

The Dashboard tab is the first thing anyone sees in Againful, but today it is built around the person's own history rather than around what they can do next. Without a profile it shows a "Pick a display name" empty state, a small grid of four kitchen ideas and one "Find an item" button. With a profile it opens with a rotating greeting and the display name, then a summary strip of counts, a contribution graph, a reuse-vs-dispose split bar, by-material category bars, the four-recipe preview, and two buttons ("Find an item", "Share an idea").

The main jobs in the app ("I have this item, what can I do with it?" and "show me something to make") sit at the bottom of a page of charts. Item search lives one screen deep on the browse screen. A new user's first impression is an empty state asking for a name. The personal stats are worth keeping, but they belong next to the log, points and badges, not in front of discovery.

## Solution

Rebuild the Dashboard tab (home) from scratch as a discovery-first, profile-independent screen, and move all the current dashboard content to a new pushed **My impact** screen that opens from the Log tab.

**Home, top to bottom:**

1. **Header.** Only the existing logo mark and the app name ("Againful"). No greeting, no display name, no counts.
2. **Hero.** Headline "A little care, made from what you have." with the tagline "Nothing wasted. Something made."
3. **Search bar.** Placeholder "Search an item — banana peel, coffee grounds…". Submitting a non-empty query opens the existing results screen with `q`, the same item search the browse screen already uses.
4. **Two action cards.**
   - **Rescue an item**, body "Got something about to go to waste?", opens the existing browse screen.
   - **Explore recipes**, body along the lines of "Cook something good from what's left.", opens the existing recipes screen.
5. **Below the cards, a "Fresh ideas" carousel.** A horizontal carousel of about 6 of the newest ideas (all kinds) with large images, fetched from the existing ideas API. There is no kind-chips row (the earlier "variant B" was dropped; see the decisions below).

**Visual direction.** The design must be original, modern and sleek. It must not be the pastel-tile mockup the user shared, and it must not change theme colors. Only existing theme tokens are used (`bg`, `card`, `ink`, `muted`, `line`, `green`, `greenDark`, `greenSoft`, `terra`, `terraSoft`, `danger`, `dangerSoft`, `stage`) plus the existing `serif` font stack. Two directions were compared in a throwaway, phone-width HTML prototype (see Further Notes):

- **Editorial.** A large serif headline with generous whitespace, a pill-shaped search field on `card` with a `line` hairline, two outlined action cards side by side (`card` fill, `line` border), and `green` used only as an accent (icons, the arrow affordance, the focused search ring). The carousel uses tall image cards with serif titles.
- **Bold block.** One large hero card filled with `greenDark` (or `green`) that holds the headline, tagline (in a light token such as `greenSoft` or `card`) and the search field. Below it sit two compact white (`card`) action cards. The carousel sits on `bg` below.

> **Chosen direction: Bold block.** As prototyped: a `greenDark` hero card (large radius) with the headline in `card` and its last words ("what you have.") in italic `greenSoft`, the tagline in `greenSoft`, subtle `green` corner rings, and the search field on `card` with a `green` submit button inside it. Two compact full-width `card` action rows, each with a solid `green` icon tile, bold title, body and chevron. A "Fresh ideas" heading with "See all →", then white carousel cards with a soft shadow, a wide image area, a white kind pill over the image and a serif title below.

**Decisions made after the prototype (they override anything below that disagrees):**

1. The chosen direction is **Bold block**.
2. Below the cards there is the **carousel only**. No kind-chips row, no variant flag or constant, no `kind` param on the recipes screen, and none of the chips-only i18n keys.
3. The six idea kinds (kitchen, beauty, cleaning, garden, home, crafts) have already landed (`mobile/constants/idea-kinds.ts`, `mobile/components/idea-kind-label.tsx`). The carousel's kind pill takes its label and icon from that registry, and the no-image fallback surface uses the kind's accent. "Explore recipes" opens the recipes screen as it is (kitchen).
4. The search placeholder text stays as agreed; truncating it with an ellipsis on narrow phones is acceptable.

**My impact screen.** A new stack route (`/impact`), pushed above the tabs with the standard titled top bar and back button. It contains everything the Dashboard shows today, unchanged in behavior: the rotating greeting (which re-rolls on focus and on language change) and the display name, the summary counts (reuses, disposals, ideas shared), the contribution graph, the reuse-vs-dispose split, the by-material category bars, the pick-a-name empty state when there is no profile, and the loading and error-with-retry states.

**Log tab entry point.** The block at the top of Log (display name, large points number, "points on this phone", the note) becomes one tappable summary card. It keeps the name and points and adds a trailing affordance, "See my impact →", that pushes the impact screen. The rest of Log (counts row, badges door, recent log entries) does not change.

## User Stories

1. As a new user without a profile, I want the home tab to show something useful right away, so that the first thing I see isn't a request to pick a name.
2. As a new user without a profile, I want to search for an item from home, so that I can find out what to do with my banana peel before setting anything up.
3. As a new user without a profile, I want to open "Rescue an item" and browse by material, so that I can explore even when I don't know what my item is called.
4. As a new user without a profile, I want to browse recipes from home, so that I can see what the catalog offers before I commit to anything.
5. As a returning user with a profile, I want home to look the same as it does for everyone, so that it stays a fast launch pad and not a report card.
6. As a returning user, I want my stats one tap away from the Log tab, so that I can still check my progress when I want to.
7. As any user, I want the header to show only the Againful logo and name, so that the brand is clear and the screen feels calm.
8. As any user, I want a short hero headline and tagline, so that I understand the app's purpose at a glance.
9. As any user, I want the search placeholder to suggest real examples ("banana peel, coffee grounds…"), so that I know what kind of thing to type.
10. As a user who types an item and submits from the keyboard, I want to land on the results screen for that query, so that I get the same matches as the browse screen's search.
11. As a user who submits an empty or whitespace-only search, I want nothing to happen (or a gentle hint), so that I don't land on an unfiltered "everything" list by accident.
12. As a user whose search finds nothing, I want the existing results empty state offering to add the item, so that a miss turns into a contribution.
13. As a user with something about to go to waste, I want a prominent "Rescue an item" card, so that the main reuse/dispose path is obvious.
14. As a user looking for inspiration, I want an "Explore recipes" card, so that I can jump straight to kitchen ideas.
15. As a user, I want a "Fresh ideas" carousel of about six recent ideas with big images, so that home feels alive and shows what people are making.
16. As a user, I want to tap a carousel card and open that idea's item, so that I can read the steps and log a reuse.
17. *(Removed: kind chips were dropped.)*
18. *(Removed.)*
19. *(Removed.)*
20. As a user on a slow connection, I want the carousel area to show a placeholder that keeps its size while ideas load, so that the page doesn't jump and the hero, search and cards work at once.
21. As a user when the catalog has no ideas, I want the carousel section hidden or replaced by a short friendly line, so that I don't see an empty strip.
22. As a user when the ideas request fails, I want a compact inline error with a retry inside the carousel section, so that the rest of home still works and I can try again.
23. As a user whose idea has no image, I want the carousel card to show a tasteful fallback (kind label on a token-colored surface), so that the row still looks deliberate.
24. As a screen-reader user, I want the logo announced as "Againful logo" and the app name read once, so that the header isn't noisy.
25. As a screen-reader user, I want the hero headline exposed as a header, so that I can jump between sections.
26. As a screen-reader user, I want the search field to have an accessible label and a search return key, so that I know what it does and can submit it.
27. As a screen-reader user, I want each action card announced as one button with its title and description, so that I don't have to swipe through its parts.
28. As a screen-reader user, I want each carousel card announced as "<idea title>, <kind>, <item name>", so that I know what opens.
29. *(Removed: kind chips were dropped.)*
30. As a user with large text enabled, I want the hero and cards to wrap rather than clip, so that nothing is cut off.
31. As a Bulgarian user, I want every new string on home, the impact screen and the Log summary card in Bulgarian, so that the app stays fully localized.
32. As a Bulgarian user, I want the carousel's kind pills to use the existing Bulgarian kind labels, so that they match the rest of the app.
33. As an en-GB user, I want the same copy as en-US (with local spelling where it matters), so that both English locales stay in sync.
34. As a user who switches language in Settings, I want home and the impact screen to re-render in the new language at once, including a fresh greeting on the impact screen.
35. As a returning user on the Log tab, I want the name-and-points block to look tappable with "See my impact →", so that I can find my charts.
36. As a returning user, I want tapping that card to push the My impact screen, so that I see my greeting, counts, contribution graph, reuse-vs-dispose split and by-material bars.
37. As a returning user on My impact, I want a loading state while my profile snapshot loads, so that I know data is coming.
38. As a returning user on My impact, I want an error with retry if the snapshot fails, so that I can recover without leaving the screen.
39. As a returning user with no log entries yet, I want the split and category charts to show their existing empty notes, so that the screen explains how to fill them.
40. As a user without a profile who reaches /impact (for example by deep link or web URL), I want the existing "Pick a display name" empty state with "Open Account", so that I know how to start tracking.
41. As a returning user on My impact, I want the greeting to change when I come back to the screen, as it does on today's dashboard, so that it still feels friendly.
42. As a user on My impact, I want a back button (and the system back gesture or hardware back on native) to return me to the Log tab, so that navigation is predictable.
43. As a user who opened results, browse or recipes from home, I want back to return me to home with my scroll position kept, so that I can try another path.
44. As a web user, I want home to fit the phone-width frame, the carousel to scroll horizontally with mouse or trackpad, and every pressable to show a pointer cursor, so that the web build feels intentional.
45. As a web user, I want pressing Enter in the search field to submit, so that it works like a normal web search box.
46. As a native user, I want the carousel to scroll smoothly and snap to cards, so that it feels native.
47. As a native user, I want the keyboard's search key to submit and dismiss the keyboard, so that I don't have to close it by hand.
48. As a contributor who just shared an idea, I want it to appear in Fresh ideas the next time home loads, so that my contribution is visible.
49. *(Removed: the variant was chosen before implementation; there is no flag.)*
50. As a future E2E test author, I want stable testIDs on the header, search, cards, carousel and impact sections, so that tests can target them.

## Implementation Decisions

**Modules built**

- **Home screen (rewritten Dashboard tab route).** Composes the header, hero (with the search inside it), action cards and the Fresh ideas carousel. It takes no data from the profile context; it does not read `useProfile` at all. The only data it fetches is the ideas query that the carousel owns.
- **Home header.** The existing header element (logo image and app name), kept as is. It remains a small shared piece so the impact screen does not need it.
- **Home hero.** Static headline and tagline. The headline has the header accessibility role. Styling follows the chosen direction; in Bold block the hero also hosts the search bar.
- **Home search bar.** A controlled text input with the search return key, autocorrect off, and an optional leading search icon. On submit it trims the query. An empty query does nothing (or shows the same gentle hint as browse). A non-empty query pushes the results route with `q` URL-encoded, exactly as the browse screen does today. Bold block puts a visible `green` submit button inside the field; keyboard submit works too. Interface: no props beyond an optional `testID`; it owns its own state.
- **Home action card.** A small presentational pressable: `title`, `body`, `icon` (an Ionicons name), `onPress`, `testID`, and an optional `tone` if the chosen direction needs one. It is one accessible button whose label is "title, body". Two instances: Rescue an item (to browse) and Explore recipes (to recipes).
- **Fresh ideas carousel.** A deep module that owns its data. It calls the existing ideas API through the existing `useQuery` hook with no kind and a limit of 6, under its own cache key, and renders loading, error-with-retry, empty and ready states inside its own section. It renders a horizontal list of large image cards (image, kind label, idea title, item name). Tapping a card pushes the item route for that idea's item, the same as the current recipe tile does. Images resolve through the existing absolute-URL helper and fall back to a surface in the kind's accent (from the idea-kinds registry) with the kind's icon when the idea has no image. The kind pill over the image uses the registry's label and icon. The section has a heading ("Fresh ideas") and a "See all" link to the recipes screen. Interface: an optional `limit` (default 6) and `testID`. The parent passes nothing else.
- **My impact screen (new stack route `/impact`).** Moves the current dashboard implementation over largely verbatim: the profile-context gating (not ready → loading, no profile → pick-a-name empty state with "Open Account" pushing account settings, no snapshot plus error → error with retry, no snapshot → loading), then the summary strip with rotating greeting and display name, the contribution graph, the action split and the category bars. It uses the shared screen wrapper with a title ("My impact") and a back button. It does not show the logo header, the recipe preview or the "Find an item"/"Share an idea" buttons.
- **Impact summary card on Log.** Replaces the top name/points texts on the Log screen with one pressable card showing the display name, the points number, "points on this phone", and a trailing "See my impact" label with a chevron. On press it pushes `/impact`. It is one accessible button labelled with name, points and destination. It only appears in Log's ready state, which already requires a profile and snapshot. The counts row, note, badges door and recent list stay as they are. The "Counts only" note may stay under the card or move to the impact screen; implementer's call, keeping its key.

**Modules modified**

- **Recipes screen.** Unchanged (kitchen ideas). No `kind` param is added.
- **Root stack layout.** Registers the new `impact` screen next to `badges`, `recipes` and the others.
- **Recipe grid module.** The four-tile recipe preview is no longer used anywhere once home is rebuilt, and gets deleted. The single recipe tile stays because the recipes screen uses it.

**Routing**

- Home search submit → results with `q`.
- Rescue an item → browse.
- Explore recipes and the carousel's "See all" → recipes (kitchen).
- Carousel card → item detail for the idea's item.
- Log summary card → `/impact` (stack push above the tabs; back returns to Log).
- The tab stays named `index` with the label "Dashboard". Renaming the tab label (for example to "Home") is not part of this issue.

**Data fetching**

- The home screen makes exactly one network request: the ideas list (limit 6, no kind). It goes through the existing API client and the existing `useQuery` hook. No new endpoints and no server changes.
- The impact screen reuses the profile context's snapshot and refresh as it does today, with no new requests. The Log summary card reads the same snapshot.
- The ideas query does not refetch on focus (as today). Pull-to-refresh is not required.

**i18n.** All three locale files (en-US, en-GB, bg) receive the same key set. The agent drafts the Bulgarian strings and flags them in the PR for user review.

New `home` namespace:

| Key | English |
| --- | --- |
| `home.logo` | Againful logo *(moved from `dashboard.logo`)* |
| `home.headline` | A little care, made from what you have. |
| `home.tagline` | Nothing wasted. Something made. |
| `home.searchPlaceholder` | Search an item — banana peel, coffee grounds… |
| `home.searchLabel` | Search for an item |
| `home.searchHint` | Type an item to search. *(only if the empty-submit hint is shown)* |
| `home.rescueTitle` | Rescue an item |
| `home.rescueBody` | Got something about to go to waste? |
| `home.recipesTitle` | Explore recipes |
| `home.recipesBody` | Cook something good from what's left. |
| `home.freshIdeas` | Fresh ideas |
| `home.seeAll` | See all |
| `home.ideasLoading` | Loading ideas… |
| `home.ideasEmpty` | No ideas yet — share the first one from the + button. |
| `home.ideaA11y` | {{title}}, {{kind}}, {{item}} |

New `impact` namespace (mostly moved from `dashboard`):

| Key | English |
| --- | --- |
| `impact.title` | My impact *(new)* |
| `impact.loading` | Loading your impact… *(was `dashboard.loading`, reworded)* |
| `impact.pickNameTitle`, `impact.pickNameBody`, `impact.openAccount` | moved from `dashboard.*`, text unchanged |
| `impact.reuses`, `impact.disposals`, `impact.ideas` | moved, unchanged |
| `impact.reuseVsDispose`, `impact.splitEmpty`, `impact.splitCounts`, `impact.reuse`, `impact.dispose` | moved, unchanged |
| `impact.byMaterial`, `impact.categoriesEmpty`, `impact.categoriesNote` | moved, unchanged |
| `impact.greetings` | moved, unchanged (array) |

New Log keys:

| Key | English |
| --- | --- |
| `log.seeImpact` | See my impact |
| `log.impactA11y` | {{name}}, {{points}} points. See my impact |

Keys that become unused and are removed: `dashboard.findItem`, `dashboard.shareIdea` (sharing stays reachable from the + tab create sheet), and `recipes.previewNote` and `recipes.browse` (only the deleted recipe preview used them). Once the moves are done, the whole `dashboard` namespace is gone. The `graph.*`, `days.*`, `kind.*`, `category.*` and `tabs.*` keys are unchanged.

**Accessibility**

- The header logo keeps its image label, and the app name is plain text.
- The hero headline has the header role.
- The search input has an accessibility label (`home.searchLabel`), not just a placeholder.
- Action cards, carousel cards and the Log summary card are each one pressable with the button role and a composed label. Inner texts do not get separate focus.
- Carousel images are decorative inside a labelled card, so they are not separately focusable.
- Touch targets are at least 44pt.
- Text uses `ink` and `muted` on `card` or `bg`. In Bold block, hero text on the dark green fill uses the light tokens and must be checked for contrast in the prototype.
- On web every pressable gets the pointer cursor, as elsewhere in the app.

**testIDs**

| testID | Where |
| --- | --- |
| `dashboard-header` | kept on the home header |
| `home-hero` | new, hero container |
| `home-search-input` | new, search field |
| `home-search-submit` | new, the green submit button inside the hero search |
| `cta-browse` | kept, now on the "Rescue an item" card |
| `cta-recipes` | new, "Explore recipes" card |
| `fresh-ideas` | new, carousel section |
| `fresh-idea-<id>` | new, each carousel card |
| `fresh-ideas-see-all` | new |
| `dashboard-summary` | moved to the impact screen's summary strip |
| `contribution-graph` | unchanged, now on the impact screen |
| `action-split-chart` | moved to the impact screen |
| `category-chart` | moved to the impact screen |
| `impact-screen` | new, impact screen root content |
| `open-impact` | new, Log summary card |
| `recipe-preview`, `browse-recipes-link`, `cta-submit` | retired with the removed preview and Share-an-idea button |

## Testing Decisions

- **What makes a good check here.** Check behavior a user can see at the highest seams (screens and navigation), not component internals. The mobile app has no test runner, and this issue does not add one.
- **Automated gates (mobile):** `npx tsc --noEmit` and `npx expo lint` must pass in `mobile/`.
- **Server:** untouched. Its `npm test` smoke test must still pass, to show that nothing changed on the API side.
- **i18n parity:** en-US, en-GB and bg must have the same key set after the change, with no leftover references to removed `dashboard.*` keys. Check this by searching the code for `dashboard.` after the change.
- **Manual walkthrough** on at least one native device or simulator and on web (phone frame):
  1. Fresh install with no profile: home renders fully and shows no name prompt. Search, both cards and the carousel all navigate correctly. /impact shows the pick-a-name empty state.
  2. With a profile and some log entries: home looks the same as without a profile. Log shows the summary card. Tapping it pushes My impact with the greeting, counts, graph, split and bars matching today's dashboard. Back returns to Log.
  3. Search: a non-empty query lands on results with matches. A whitespace-only query does not navigate. A query with no matches shows the existing add-item empty state.
  4. Ideas states: slow network (throttled on web) shows the placeholder. An empty catalog (or a stub returning no ideas) hides the section or shows the empty line. API unreachable shows the inline error, and retry recovers. Hero, search and cards keep working in every case.
  5. Impact states: profile snapshot error shows error and retry, then recovery.
  6. Switching language to bg and back updates all new copy without a restart.
  7. Screen reader pass (VoiceOver or TalkBack, at least one) over home and the Log card: labels and roles as specified.
- **Prior art:** the existing screens (browse, results, recipes) already use the loading/error/empty pattern from the shared UI states and `useQuery`. The new carousel follows the same pattern, so manual checks of those states carry over.

## Out of Scope

- Any ingredient model or ingredient matching ("Use my ingredients").
- Grouping ideas into "Make it now / Almost there / Save for later".
- A step-by-step "Start making" mode on idea or recipe details.
- Moving to the six brand categories (Kitchen, Beauty, Cleaning, Garden, Home, Crafts). That landed separately (`docs/specs/idea-kinds.md`) before this work; home only reads its registry.
- Any theme color change, new color tokens, or new fonts.
- Server or API changes, including new endpoints, sorting or "featured" ideas.
- Renaming the Dashboard tab label or icon.
- Adding a mobile test runner or E2E suite.
- Changing the rest of the Log tab (counts row, badges door, recent entries), the leaderboard or settings.

## Further Notes

- **Prototype step (done).** A throwaway, phone-width HTML prototype showed both directions side by side with the real tokens and serif stack. The user picked Bold block with the carousel only. The prototype is not committed to the repo.
- **Possible follow-ups (not in this issue):** rename the "Dashboard" tab label to match its new role; decide whether the Log counts row is redundant now that My impact exists.
- **Bulgarian copy** is drafted by the implementing agent and must be called out in the PR description for the user to review before merge.
- No `GLOSSARY.md` or ADRs exist yet. The terms used here (item, idea, kind, recipe = kitchen idea, log entry, reuse/dispose, profile, points, badge) follow the code and i18n. "My impact" is a new UI term for the personal stats screen, not a new domain concept.
