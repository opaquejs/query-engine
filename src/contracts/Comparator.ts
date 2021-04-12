export type Comparators = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in";

export interface ComparatorInterface {
  compare(left: unknown, comparator: Comparators, right: unknown): boolean;
}
