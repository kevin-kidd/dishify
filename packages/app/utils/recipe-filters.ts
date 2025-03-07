export type CostFilter = "all" | "budget" | "moderate" | "premium";
export type TimeFilter = "all" | "quick" | "moderate" | "long";
export type DifficultyFilter = "all" | "Easy" | "Medium" | "Hard";
export type SortBy = "recent" | "popular" | "rating" | "name";

export const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "name", label: "Name (A-Z)" },
] as const;

export const difficultyOptions = [
  { value: "all", label: "All Difficulties" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
] as const;

export const costOptions = [
  { value: "all", label: "All Costs" },
  { value: "budget", label: "Budget Friendly" },
  { value: "moderate", label: "Moderate" },
  { value: "premium", label: "Premium" },
] as const;

export const timeOptions = [
  { value: "all", label: "All Times" },
  { value: "quick", label: "Quick (< 30 mins)" },
  { value: "moderate", label: "Medium (30-60 mins)" },
  { value: "long", label: "Long (> 60 mins)" },
] as const;

export const costMap = {
  budget: { min: 0, max: 1000 },
  moderate: { min: 1000, max: 3000 },
  premium: { min: 3000, max: 999999 },
} as const;

export const timeMap = {
  quick: { min: 0, max: 30 },
  moderate: { min: 30, max: 60 },
  long: { min: 60, max: 999 },
} as const;
