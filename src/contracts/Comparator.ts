export type Comparators = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in";

export interface ComparatorInterface {
  compare(comparator: Comparators, value: unknown): boolean;
}
