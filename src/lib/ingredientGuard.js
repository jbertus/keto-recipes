// Ingredient ambiguity detection engine

export const AMBIGUOUS_RULES = [
  {
    match: /tortilla/i,
    question: "What brand and size tortilla?",
    fields: ["brand", "size"]
  },
  {
    match: /sausage/i,
    question: "Ground or link sausage?",
    fields: ["type"]
  },
  {
    match: /\bmilk\b/i,
    question: "What type of milk?",
    fields: ["type"]
  },
  {
    match: /\boil\b/i,
    question: "What type of oil?",
    fields: ["type"]
  },
  {
    match: /sweetener|sugar/i,
    question: "Which sweetener?",
    fields: ["type"]
  },
  {
    match: /cheese/i,
    question: "What kind of cheese?",
    fields: ["type"]
  },
  {
    match: /pepper/i,
    question: "Bell pepper or spice pepper?",
    fields: ["type"]
  },
  {
    match: /meat/i,
    question: "What type of meat?",
    fields: ["type"]
  }
];

export function checkIngredientAmbiguity(value) {
  if (!value) return null;

  for (const rule of AMBIGUOUS_RULES) {
    if (rule.match.test(value)) {
      return rule;
    }
  }

  return null;
}