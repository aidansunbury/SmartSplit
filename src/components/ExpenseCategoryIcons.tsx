import {
  Armchair,
  Bike,
  Carrot,
  CircleParking,
  Gift,
  Hotel,
  House,
  HousePlus,
  NotepadText,
  Popcorn,
  Stethoscope,
  Utensils,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import type { expenseCategories } from "~/server/db/schema";

type Category = (typeof expenseCategories.enumValues)[number];
const categoryKeywords: Record<Category, string[]> = {
  restaurants: [
    "restaurant",
    "dining",
    "cafe",
    "coffee",
    "starbucks",
    "mcdonalds",
    "burger",
    "pizza",
    "sushi",
    "lunch",
    "dinner",
    "takeout",
    "doordash",
    "ubereats",
    "grubhub",
    "deli",
    "eatery",
    "bistro",
    "chipotle",
    "subway",
  ],
  entertainment: [
    "movie",
    "netflix",
    "hulu",
    "spotify",
    "disney",
    "concert",
    "theater",
    "amazon prime",
    "hbo",
    "cinema",
    "ticket",
    "show",
    "game",
    "steam",
    "playstation",
    "xbox",
    "festival",
    "event",
    "apple tv",
    "paramount",
  ],
  groceries: [
    "safeway",
    "kroger",
    "walmart",
    "target",
    "costco",
    "trader joes",
    "whole foods",
    "aldi",
    "food",
    "grocery",
    "supermarket",
    "market",
    "produce",
    "butcher",
    "bakery",
    "sams club",
  ],
  maintenance: [
    "repair",
    "maintenance",
    "plumber",
    "electrician",
    "contractor",
    "handyman",
    "service",
    "fixing",
    "installation",
    "parts",
    "replacement",
    "inspection",
    "cleaning",
    "hardware",
    "home depot",
    "lowes",
  ],
  mortgage: [
    "mortgage",
    "loan payment",
    "house payment",
    "principal",
    "escrow",
    "wells fargo",
    "chase",
    "bank of america",
    "home loan",
    "lending",
  ],
  rent: [
    "rent",
    "lease",
    "apartment",
    "housing",
    "tenant",
    "landlord",
    "property",
    "monthly rent",
    "rental payment",
    "complex",
  ],
  household: [
    "furniture",
    "decor",
    "bedding",
    "kitchen",
    "bathroom",
    "cleaning",
    "supplies",
    "ikea",
    "home goods",
    "bed bath",
    "target",
    "walmart",
    "amazon",
    "appliance",
    "storage",
    "organization",
  ],
  gifts: [
    "gift",
    "present",
    "birthday",
    "christmas",
    "holiday",
    "wedding",
    "anniversary",
    "card",
    "celebration",
    "party",
    "baby shower",
    "graduation",
    "registry",
  ],
  lodging: [
    "hotel",
    "airbnb",
    "motel",
    "resort",
    "inn",
    "lodging",
    "vacation rental",
    "booking.com",
    "expedia",
    "marriott",
    "hilton",
    "hyatt",
    "stay",
  ],
  parking: [
    "parking",
    "garage",
    "lot",
    "meter",
    "valet",
    "spot",
    "monthly parking",
    "parkwhiz",
    "spothero",
    "airport parking",
    "structure",
  ],
  transportation: [
    "uber",
    "lyft",
    "taxi",
    "bus",
    "train",
    "metro",
    "subway",
    "transit",
    "fare",
    "ticket",
    "gas",
    "fuel",
    "shell",
    "chevron",
    "airline",
    "flight",
  ],
  general: [
    "general",
    "miscellaneous",
    "other",
    "unknown",
    "various",
    "supplies",
    "stuff",
    "goods",
    "items",
    "purchase",
  ],
  utilities: [
    "electric",
    "water",
    "gas",
    "sewer",
    "waste",
    "utility",
    "power",
    "pge",
    "edison",
    "energy",
    "bill",
    "consumption",
    "meter",
  ],
  "phone and internet": [
    "phone",
    "mobile",
    "cellular",
    "internet",
    "wifi",
    "broadband",
    "verizon",
    "att",
    "tmobile",
    "sprint",
    "comcast",
    "xfinity",
    "cox",
    "spectrum",
    "data",
  ],
  "health and medical": [
    "doctor",
    "medical",
    "healthcare",
    "hospital",
    "clinic",
    "dental",
    "pharmacy",
    "prescription",
    "walgreens",
    "cvs",
    "urgent care",
    "insurance",
    "copay",
    "laboratory",
    "specialist",
    "therapy",
  ],
};

export const CategoryKeywordMap = new Map<string, Category>(
  Object.entries(categoryKeywords).flatMap(([category, keywords]) =>
    keywords.map((keyword) => [keyword, category] as const),
  ) as [string, Category][],
);

export const CategoryIconMap = new Map<string, React.ReactNode>([
  ["restaurants", <Utensils key={"restaurants"} />],
  ["groceries", <Carrot key={"groceries"} />],
  ["rent", <HousePlus key={"rent"} />],
  ["mortgage", <House key={"mortgage"} />],
  ["household", <Armchair key={"household"} />],
  ["lodging", <Hotel key={"lodging"} />],
  ["parking", <CircleParking key={"parking"} />],
  ["transportation", <Bike key={"transportation"} />],
  ["general", <NotepadText key={"general"} />],
  ["utilities", <Zap key={"utilities"} />],
  ["phone and internet", <Wifi key={"phone and internet"} />],
  ["health and medical", <Stethoscope key={"health and medical"} />],
  ["gifts", <Gift key={"gifts"} />],
  ["maintenance", <Wrench key={"maintenance"} />],
  ["entertainment", <Popcorn key={"entertainment"} />],
]);

// Needed when icon must be resized. This can be extended to provide more customizations.
export const CategoryIconMapSize = new Map<
  string,
  (props: { size?: number }) => React.ReactNode
>([
  ["restaurants", (props) => <Utensils key={"restaurants"} {...props} />],
  ["groceries", (props) => <Carrot key={"groceries"} {...props} />],
  ["rent", (props) => <HousePlus key={"rent"} {...props} />],
  ["mortgage", (props) => <House key={"mortgage"} {...props} />],
  ["household", (props) => <Armchair key={"household"} {...props} />],
  ["lodging", (props) => <Hotel key={"lodging"} {...props} />],
  ["parking", (props) => <CircleParking key={"parking"} {...props} />],
  ["transportation", (props) => <Bike key={"transportation"} {...props} />],
  ["general", (props) => <NotepadText key={"general"} {...props} />],
  ["utilities", (props) => <Zap key={"utilities"} {...props} />],
  [
    "phone and internet",
    (props) => <Wifi key={"phone and internet"} {...props} />,
  ],
  [
    "health and medical",
    (props) => <Stethoscope key={"health and medical"} {...props} />,
  ],
  ["gifts", (props) => <Gift key={"gifts"} {...props} />],
  ["maintenance", (props) => <Wrench key={"maintenance"} {...props} />],
  ["entertainment", (props) => <Popcorn key={"entertainment"} {...props} />],
]);
