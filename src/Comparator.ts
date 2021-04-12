import { ComparatorInterface, Comparators } from "./contracts/Comparator";

export type Comparable = string | number | object | boolean;

export class Comparator implements ComparatorInterface {
  compare(left: unknown, comparison: Comparators, right: unknown) {
    if (!this.isValidComparable(left)) {
      throw new Error(`The left value [${left}] is not comparable.`);
    }
    if (comparison == "in") {
      if (!Array.isArray(right)) {
        throw new Error(
          `Comparator: value [${right}] is not an array and it can therefore not be checked if [${left}] is inside of this`
        );
      }
      return this.in(left, right);
    }
    if (!this.isValidComparable(right)) {
      throw new Error(`The right value [${right}] is not comparable.`);
    }
    return this[comparison](left, right);
  }

  isValidComparable(value: unknown): value is string | number | object | boolean {
    return ["string", "number", "object", "boolean"].includes(typeof value);
  }

  "=="(left: Comparable, right: Comparable) {
    return left === right;
  }
  "!="(left: Comparable, right: Comparable) {
    return !this["=="](left, right);
  }
  "<"(left: Comparable, right: Comparable) {
    return left < right;
  }
  ">"(left: Comparable, right: Comparable) {
    return left > right;
  }
  "<="(left: Comparable, right: Comparable) {
    return this["<"](left, right) || this["=="](left, right);
  }
  ">="(left: Comparable, right: Comparable) {
    return this[">"](left, right) || this["=="](left, right);
  }
  in(left: Comparable, right: Comparable[]) {
    return right.some((value) => this["=="](value, left));
  }
}
