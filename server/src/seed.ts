import type { DB } from "./db.js";
import { BADGES, type DisposalMethod } from "./rules.js";

type SeedDisposal = {
  method: DisposalMethod;
  title: string;
  steps: string[];
};

type SeedItem = {
  id: string;
  name: string;
  aliases: string[];
  categoryId: string;
  summary: string;
  disposal: SeedDisposal;
};

const CATEGORIES: { id: string; name: string; description: string }[] = [
  {
    id: "food",
    name: "Food",
    description: "Peels, grounds, shells, and scraps that still have a kitchen use.",
  },
  {
    id: "plastic",
    name: "Plastic",
    description: "Bottles, tubs, and bags worth a second use before they are recycled.",
  },
  {
    id: "metal",
    name: "Metal",
    description: "Cans and tins that rinse clean and can hold something else.",
  },
  {
    id: "glass",
    name: "Glass",
    description: "Jars that outlast whatever came in them.",
  },
  {
    id: "paper",
    name: "Paper",
    description: "Cardboard that is still sturdy enough to build with.",
  },
  {
    id: "other",
    name: "Other",
    description: "Anything that does not fit the other shelves.",
  },
];

const FALLBACKS: { categoryId: string; disposal: SeedDisposal }[] = [
  {
    categoryId: "food",
    disposal: {
      method: "compost",
      title: "Compost",
      steps: [
        "Keep meat, lots of oil, and moldy food out of a home compost pile.",
        "Chop large scraps so they break down faster.",
        "If you have no compost, ask a neighbor or a community garden before using the trash.",
      ],
    },
  },
  {
    categoryId: "plastic",
    disposal: {
      method: "recycle",
      title: "Rinse and recycle",
      steps: [
        "Empty it and rinse off food.",
        "Recycle it only if your local program accepts that type of plastic.",
        "Leave it loose in the bin. A bag of mixed plastic often gets thrown out.",
      ],
    },
  },
  {
    categoryId: "metal",
    disposal: {
      method: "recycle",
      title: "Rinse and recycle",
      steps: [
        "Empty the can and rinse it.",
        "You can leave a paper label on.",
        "Place it loose in the recycling bin.",
      ],
    },
  },
  {
    categoryId: "glass",
    disposal: {
      method: "recycle",
      title: "Rinse and recycle",
      steps: [
        "Rinse the jar.",
        "Take off the lid and recycle metal lids if your program accepts them.",
        "Do not include broken drinking glasses or windows with food jars.",
      ],
    },
  },
  {
    categoryId: "paper",
    disposal: {
      method: "recycle",
      title: "Recycle it dry",
      steps: [
        "Flatten boxes and remove tape if it peels off easily.",
        "Keep food, grease, and wet paper out of the recycling.",
        "Greasy paper can be composted if it is not coated in plastic.",
      ],
    },
  },
  {
    categoryId: "other",
    disposal: {
      method: "trash",
      title: "Trash",
      steps: [
        "Bag it with household trash if it is not hazardous.",
        "Batteries, paint, solvents, and leftover chemicals are household hazardous waste. Take those to a collection site.",
        "Rules differ by city. Check before you assume the bin will take it.",
      ],
    },
  },
];

const ITEMS: SeedItem[] = [
  {
    id: "banana-peels",
    name: "Banana peels",
    aliases: ["banana peel", "banana skin"],
    categoryId: "food",
    summary: "Sweet peels with enough flavor left for a pan and a little moisture for dry hands.",
    disposal: {
      method: "compost",
      title: "Compost",
      steps: [
        "Chop the peels so they do not mat together.",
        "Add them to a food-scrap pail or outdoor compost.",
        "Stickers on the fruit should go in the trash, not the pile.",
      ],
    },
  },
  {
    id: "coffee-grounds",
    name: "Coffee grounds",
    aliases: ["used coffee", "coffee grounds", "leftover coffee"],
    categoryId: "food",
    summary: "Used grounds still scrub, season, and feed a compost pile.",
    disposal: {
      method: "compost",
      title: "Compost",
      steps: [
        "Cool the grounds and the paper filter.",
        "Add both to compost. A paper filter is fine if it is unbleached or your pile accepts it.",
        "Spread large amounts through the pile so it does not turn slimy.",
      ],
    },
  },
  {
    id: "citrus-peels",
    name: "Citrus peels",
    aliases: ["orange peel", "lemon peel", "lime peel", "citrus peel"],
    categoryId: "food",
    summary: "Orange, lemon, and lime peels still carry oil, scent, and a little bitterness worth keeping.",
    disposal: {
      method: "compost",
      title: "Compost",
      steps: [
        "Chop the peels. Whole rinds take a long time to break down.",
        "Add modest amounts. A pile of only citrus can sit there smelling sharp.",
        "Worm bins are pickier than outdoor piles, so go easy if you use one.",
      ],
    },
  },
  {
    id: "eggshells",
    name: "Eggshells",
    aliases: ["egg shells", "eggshell"],
    categoryId: "food",
    summary: "Rinsed shells are mostly calcium, useful in stock and as a very fine scrub once baked.",
    disposal: {
      method: "compost",
      title: "Compost",
      steps: [
        "Rinse the shells so the bin does not smell.",
        "Crush them. Powder breaks down faster than halves.",
        "Add them to compost or bury them in a garden bed.",
      ],
    },
  },
  {
    id: "stale-bread",
    name: "Stale bread",
    aliases: ["old bread", "day-old bread", "bread ends"],
    categoryId: "food",
    summary: "Dry bread is already halfway to croutons or pudding. Mold is the line where it stops being food.",
    disposal: {
      method: "compost",
      title: "Compost",
      steps: [
        "Compost bread that is dry or stale but not moldy.",
        "Moldy bread goes in the trash. Mold spreads through a home pile.",
        "Tear plain bread into pieces so animals are less interested.",
      ],
    },
  },
  {
    id: "vegetable-scraps",
    name: "Vegetable scraps",
    aliases: ["veggie scraps", "vegetable peels", "onion skins", "carrot peels"],
    categoryId: "food",
    summary: "Ends, peels, and stems from a week of cooking make a pot of broth.",
    disposal: {
      method: "compost",
      title: "Compost",
      steps: [
        "Compost raw peels, cores, and stems.",
        "Leave out moldy produce and large amounts of oil.",
        "Chop woody ends such as corn cobs if your pile is small.",
      ],
    },
  },
  {
    id: "pet-bottles",
    name: "PET bottles",
    aliases: ["plastic bottle", "water bottle", "soda bottle", "pet bottle"],
    categoryId: "plastic",
    summary: "Clear drink bottles, usually marked PET or #1, that cut into a funnel or a planter.",
    disposal: {
      method: "recycle",
      title: "Rinse and recycle",
      steps: [
        "Empty the bottle and give it a quick rinse.",
        "Put the cap back on if your local program wants caps on bottles.",
        "Recycle it loose, not inside a plastic bag.",
      ],
    },
  },
  {
    id: "plastic-bags",
    name: "Plastic bags",
    aliases: ["shopping bag", "carrier bag", "film plastic", "bread bag"],
    categoryId: "plastic",
    summary: "Soft film bags that clog curbside bins and still work as packing material or a braided basket.",
    disposal: {
      method: "drop-off",
      title: "Store drop-off",
      steps: [
        "Make sure the bags are clean and dry.",
        "Bundle them inside one bag.",
        "Take them to a grocery-store film drop-off. Most curbside bins do not want them.",
      ],
    },
  },
  {
    id: "yogurt-cups",
    name: "Yogurt cups",
    aliases: ["yoghurt pot", "yogurt pot", "plastic tub"],
    categoryId: "plastic",
    summary: "Small rinsed tubs that start seeds or hold paint and paper clips.",
    disposal: {
      method: "recycle",
      title: "Rinse and recycle",
      steps: [
        "Scrape or rinse out the yogurt.",
        "Check the number on the cup. Recycle it only if your city takes that plastic.",
        "Foil lids are trash unless they are clean aluminum and your program accepts them.",
      ],
    },
  },
  {
    id: "aluminum-cans",
    name: "Aluminum cans",
    aliases: ["aluminium can", "soda can", "pop can"],
    categoryId: "metal",
    summary: "Light drink cans that become a lantern or a small cup once the edge is made safe.",
    disposal: {
      method: "recycle",
      title: "Rinse and recycle",
      steps: [
        "Empty the can and rinse it.",
        "You do not need to crush it, though crushing saves space.",
        "Put it in the recycling loose.",
      ],
    },
  },
  {
    id: "tin-cans",
    name: "Tin cans",
    aliases: ["steel can", "food can", "soup can"],
    categoryId: "metal",
    summary: "Food cans sturdy enough for utensils or a painted holder, after the lid is dealt with safely.",
    disposal: {
      method: "recycle",
      title: "Rinse and recycle",
      steps: [
        "Rinse out the food.",
        "Drop the detached lid into the can or recycle it beside the can so nobody gets cut.",
        "Labels can stay on.",
      ],
    },
  },
  {
    id: "glass-jars",
    name: "Glass jars",
    aliases: ["jam jar", "mason jar", "glass jar", "sauce jar"],
    categoryId: "glass",
    summary: "A jar with its lid is already a container. Washed and dried, it stores food or becomes a lantern.",
    disposal: {
      method: "recycle",
      title: "Rinse and recycle",
      steps: [
        "Rinse the jar.",
        "Recycle the metal lid separately if that is how your city does it.",
        "Broken jars belong in the trash, wrapped so they cannot cut anyone. Do not mix them with intact bottles.",
      ],
    },
  },
  {
    id: "cardboard",
    name: "Cardboard",
    aliases: ["cardboard box", "corrugated cardboard", "shipping box"],
    categoryId: "paper",
    summary: "Clean corrugated boxes that fold into desk trays or lie flat under mulch.",
    disposal: {
      method: "recycle",
      title: "Recycle it dry",
      steps: [
        "Flatten the box and remove packing tape if it comes off.",
        "Recycle clean, dry cardboard.",
        "Greasy pizza boxes and wet cardboard should be composted or trashed, not recycled.",
      ],
    },
  },
];

const SEEDED_AT = "2026-01-01T00:00:00.000Z";

export function seedIfEmpty(db: DB): void {
  const insertBadge = db.prepare(
    "INSERT OR IGNORE INTO badges (slug, title, rule, sort_order) VALUES (?, ?, ?, ?)",
  );
  for (const badge of BADGES) {
    insertBadge.run(badge.slug, badge.title, badge.rule, badge.sortOrder);
  }

  const count = db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number } | undefined;
  if (count && Number(count.n) > 0) return;

  const insertCategory = db.prepare("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)");
  for (const category of CATEGORIES) {
    insertCategory.run(category.id, category.name, category.description);
  }

  const insertFallback = db.prepare(
    "INSERT INTO disposals (id, item_id, category_id, method, title, steps) VALUES (?, NULL, ?, ?, ?, ?)",
  );
  for (const fallback of FALLBACKS) {
    insertFallback.run(
      `disposal-category-${fallback.categoryId}`,
      fallback.categoryId,
      fallback.disposal.method,
      fallback.disposal.title,
      JSON.stringify(fallback.disposal.steps),
    );
  }

  const insertItem = db.prepare(
    "INSERT INTO items (id, name, aliases, category_id, summary, status, created_at) VALUES (?, ?, ?, ?, ?, 'published', ?)",
  );
  const insertDisposal = db.prepare(
    "INSERT INTO disposals (id, item_id, category_id, method, title, steps) VALUES (?, ?, ?, ?, ?, ?)",
  );

  for (const item of ITEMS) {
    insertItem.run(item.id, item.name, JSON.stringify(item.aliases), item.categoryId, item.summary, SEEDED_AT);
    insertDisposal.run(
      `disposal-${item.id}`,
      item.id,
      item.categoryId,
      item.disposal.method,
      item.disposal.title,
      JSON.stringify(item.disposal.steps),
    );
  }
}
