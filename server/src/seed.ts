import type { DB } from "./db.js";
import { BADGES, type DisposalMethod, type IdeaKind } from "./rules.js";

type SeedIdea = {
  kind: IdeaKind;
  title: string;
  materials: string;
  steps: string[];
};

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
  ideas: SeedIdea[];
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
    ideas: [
      {
        kind: "cook",
        title: "Banana peel bacon",
        materials: "2 ripe banana peels\n1 tbsp soy sauce\n1 tsp maple syrup or honey\n1/2 tsp smoked paprika\n1/4 tsp garlic powder\nA little oil",
        steps: [
          "Scrape away the white pith so the peels can crisp.",
          "Toss them with soy sauce, syrup, paprika, and garlic.",
          "Pan-fry in a little oil until browned and chewy.",
          "Use them in a sandwich or next to eggs.",
        ],
      },
      {
        kind: "beauty",
        title: "Peel rub for dry hands",
        materials: "Inside of a fresh banana peel",
        steps: [
          "Rub the inside of the peel over clean, dry hands for about a minute.",
          "Wait ten minutes.",
          "Rinse, then use your usual moisturizer.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "beauty",
        title: "Coffee body scrub",
        materials: "1/2 cup used coffee grounds\n2 tbsp coconut or olive oil",
        steps: [
          "Mix cool, used grounds with the oil.",
          "Massage onto damp arms or legs in the shower, then rinse.",
          "Skip the face. Grounds are too coarse for it.",
        ],
      },
      {
        kind: "cook",
        title: "Savory coffee rub",
        materials: "1 tbsp dried used coffee, finely crushed\n1 tsp salt\n1 tsp brown sugar\n1/2 tsp black pepper",
        steps: [
          "Dry the grounds in a low oven until they crumble.",
          "Mix them with salt, sugar, and pepper.",
          "Pat the rub on mushrooms or tofu and roast until browned.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "cook",
        title: "Candied citrus peel",
        materials: "Peels from 2 oranges or lemons\n1 cup sugar\n1 cup water\nA pinch of salt",
        steps: [
          "Slice peels into strips and boil them once, then drain, to soften the bitter pith.",
          "Simmer the strips in sugar and water until they look translucent.",
          "Dry them on a rack. Toss with a little extra sugar if you want them sandy.",
        ],
      },
      {
        kind: "beauty",
        title: "Citrus sugar scrub",
        materials: "Peel of 1 orange or lemon, finely chopped\n1/2 cup sugar\n2 tbsp oil",
        steps: [
          "Stir the chopped peel and sugar into the oil.",
          "Scrub damp hands or feet, then rinse.",
          "Use it the day you make it. Fresh peel does not keep.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "cook",
        title: "Shells in the stock pot",
        materials: "Shells from 4–6 eggs, rinsed\nVegetable scraps or a stock you are already making",
        steps: [
          "Rinse the shells and pinch out the inner membrane.",
          "Add them to a simmering stock.",
          "Strain them out before you serve. They do not dissolve.",
        ],
      },
      {
        kind: "beauty",
        title: "Baked-shell hand scrub",
        materials: "Shells from 2 eggs\n1 tsp honey\n1 tsp oil",
        steps: [
          "Bake clean shells at 200°F / 95°C for 10 minutes so they are dry.",
          "Grind them until the powder feels fine, with no sharp chips.",
          "Mix a pinch with honey and oil, scrub your hands, and rinse. Do not use it on broken skin.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "cook",
        title: "Skillet croutons",
        materials: "2 cups stale bread, torn\n1 tbsp oil\nA pinch of salt\nDried herbs you already have",
        steps: [
          "Toss the bread with oil, salt, and herbs.",
          "Fry in a skillet, stirring, until the edges are crisp.",
          "Put them on soup or a salad the same day.",
        ],
      },
      {
        kind: "cook",
        title: "Stale-bread pudding",
        materials: "3 cups cubed stale bread\n2 eggs\n1 1/2 cups milk\n2 tbsp sugar\n1 tsp vanilla, if you have it",
        steps: [
          "Heat the oven to 350°F / 175°C.",
          "Whisk eggs, milk, sugar, and vanilla. Pour over the bread and let it sit for 10 minutes.",
          "Bake in a small dish until the center is just set, about 30 minutes.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "cook",
        title: "Scrap broth",
        materials: "4 cups clean vegetable scraps\nOnion ends, carrot peels, celery leaves, herb stems\n8 cups water\nSalt",
        steps: [
          "Keep a container of scraps in the freezer until it is full. Skip mold, rotten spots, and lots of broccoli if you dislike the smell.",
          "Cover the scraps with water and simmer for 40 minutes.",
          "Strain, salt, and use the broth within a few days or freeze it.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "useful",
        title: "Funnel from the neck",
        materials: "1 clean PET bottle\nScissors\nTape to cover the cut edge",
        steps: [
          "Rinse the bottle and peel off the label if it is in the way.",
          "Cut across the shoulder so the neck becomes a funnel.",
          "Tape the cut rim, then use it for dry goods or watering a plant.",
        ],
      },
      {
        kind: "art",
        title: "Hanging bottle planter",
        materials: "1 PET bottle\nString\nA nail\nPotting mix and a cutting or seed",
        steps: [
          "Cut a window in the side of the bottle, leaving the ends intact.",
          "Poke drainage holes, add soil, and plant something small.",
          "Hang it by the neck where water can drip.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "useful",
        title: "Packing cushions",
        materials: "Clean, dry plastic bags",
        steps: [
          "Stuff a few bags inside one bag.",
          "Tuck the bundle around something you are shipping or storing.",
          "Keep dirty or crumbly bags out. They shed bits everywhere.",
        ],
      },
      {
        kind: "art",
        title: "Braided bag basket",
        materials: "About 10 clean plastic bags\nScissors",
        steps: [
          "Cut each bag into loops and knot them into long strips.",
          "Braid three strips, adding new strips as you go.",
          "Coil the braid and stitch it to itself with a thin strip of bag until it becomes a small basket.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "useful",
        title: "Seed-starting pots",
        materials: "Clean yogurt cups\nA nail\nSeed-starting mix\nSeeds",
        steps: [
          "Wash the cups with soap so the milk smell is gone.",
          "Poke two or three holes in the bottom.",
          "Fill with damp mix, sow the seeds, and set the cups on a tray.",
        ],
      },
      {
        kind: "art",
        title: "Painted desk cups",
        materials: "Clean yogurt cups\nAcrylic paint or leftover nail polish\nPaper clips, pins, or cotton swabs",
        steps: [
          "Paint the outside and let it dry.",
          "Group two or three cups and use them for small desk things.",
          "Skip the dishwasher. The paint will not survive it.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "art",
        title: "Punched-can lantern",
        materials: "1 empty aluminum can\nA nail\nA hammer\nA tea light\nTape",
        steps: [
          "Rinse the can and fill it with water, then freeze it so it does not collapse while you punch it.",
          "Punch a pattern of holes with the nail. Tape the rim if it feels sharp.",
          "Add a tea light. Never leave the flame unattended.",
        ],
      },
      {
        kind: "useful",
        title: "Workshop parts cup",
        materials: "1 aluminum can\nTape or a file\nScissors that can cut thin metal",
        steps: [
          "Cut the top off below the ridge if you want a wider mouth.",
          "File or tape every cut edge before you put your hand near it.",
          "Use it for screws, coins, or soil. Do not store food in an opened can.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "useful",
        title: "Utensil crock",
        materials: "1 large food can\nTape\nSoap",
        steps: [
          "Remove the lid completely and tape the top rim so it cannot cut.",
          "Wash out the food smell.",
          "Dry it and stand wooden spoons in it. Keep raw-food cans for tools, not for drinking.",
        ],
      },
      {
        kind: "art",
        title: "Painted desk caddy",
        materials: "2 or 3 clean food cans\nTape\nAcrylic paint\nStrong glue",
        steps: [
          "Tape every rim.",
          "Paint the outsides and let them dry.",
          "Glue the cans to a piece of cardboard if you want them to stay together as a caddy.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "useful",
        title: "Pantry jar",
        materials: "A glass jar with a lid\nHot water and soap\nA label",
        steps: [
          "Wash the jar and lid. Soak until the old label slides off.",
          "Dry them completely so dry food does not clump.",
          "Fill with beans, spices, or leftovers and write the date on a new label.",
        ],
      },
      {
        kind: "art",
        title: "Painted votive",
        materials: "A clean glass jar\nGlass paint or tissue paper and glue\nA tea light or LED candle",
        steps: [
          "Decorate the outside and let it dry.",
          "Drop in an LED candle, or a tea light if the glass is thick.",
          "Set a real flame on a stable surface and put it out before you leave the room.",
        ],
      },
    ],
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
    ideas: [
      {
        kind: "art",
        title: "Desk organizer",
        materials: "1 clean cardboard box\nA ruler\nA knife or scissors\nGlue",
        steps: [
          "Cut the box down to the height you want for envelopes or notebooks.",
          "Cut extra walls from the leftover flaps and glue in a divider.",
          "Leave it plain or wrap it in scrap paper.",
        ],
      },
      {
        kind: "useful",
        title: "Sheet mulch",
        materials: "Plain brown cardboard\nWater",
        steps: [
          "Peel off tape, labels, and any glossy coating.",
          "Lay the cardboard on bare soil where you want to stop weeds.",
          "Wet it and cover it with leaves, wood chips, or compost so it stays put.",
        ],
      },
    ],
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
  const insertIdea = db.prepare(
    `INSERT INTO ideas (id, item_id, kind, title, materials, steps, author_profile_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, 'published', ?)`,
  );
  const insertDisposal = db.prepare(
    "INSERT INTO disposals (id, item_id, category_id, method, title, steps) VALUES (?, ?, ?, ?, ?, ?)",
  );

  for (const item of ITEMS) {
    insertItem.run(item.id, item.name, JSON.stringify(item.aliases), item.categoryId, item.summary, SEEDED_AT);
    item.ideas.forEach((idea, index) => {
      insertIdea.run(
        `${item.id}-idea-${index + 1}`,
        item.id,
        idea.kind,
        idea.title,
        idea.materials,
        JSON.stringify(idea.steps),
        SEEDED_AT,
      );
    });
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
