# Ideas list their Ingredients as linked Items

Matching an Ingredient list to Ideas ("you have 3 of 4, missing honey") needs to know exactly which Items each Idea uses. Until now an Idea pointed at one Item and described everything else in free-text `materials`. We decided to give every Idea a structured list of the Items it needs, backfill it for existing Ideas, and have the share-an-idea form pick Ingredients from the catalog.

## Considered options

- **Fuzzy-match Ingredient names against `materials` text.** No schema change, but have/missing counts would be guesses, and the Make it now / Almost there / Save for later grouping depends on those counts being right.
- **Match only on the Idea's single Item.** Simple, but there is no notion of "missing", so the grouping can't exist.

## Consequences

- Pantry staples an Idea needs (honey, gelatin) must exist as Items in the catalog.
- Only Key Ingredients are linked. Basics (salt, oil, spices) stay in the text, so the "missing" counts stay meaningful.
- An "A or B" choice is linked as one Item. Alternative groups were left out on purpose.
- Instead of backfilling, all existing Ideas (and their images) are deleted, with no backup, and the seed creates no Ideas. Log entries and points are kept. Every Idea from now on comes through the share form, so each one has its Ingredients linked from the start.
- The free-text `materials` stays for quantities and tools, but it no longer drives matching.
