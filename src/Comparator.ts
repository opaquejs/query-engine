import { ComparatorInterface, Comparators } from "./contracts/Comparator";
export type Comparable = unknown;
export type SafeComparable = string | number | boolean | object;

export abstract class AbstractComparator implements ComparatorInterface {
  compare(left: unknown, comparison: Comparators, right: unknown) {
    if (comparison == "in") {
      if (!Array.isArray(right)) {
        throw new Error(
          `Comparator: value [${right}] is not an array and it can therefore not be checked if [${left}] is inside of this`
        );
      }
      return this.rawin(left, right);
    }
    return this[`raw${comparison}` as const](left, right);
  }

  isEmpty(value: unknown): value is Exclude<unknown, null | undefined> {
    return value === null || value === undefined;
  }

  "raw<="(left: Comparable, right: Comparable): boolean {
    return this.compare(left, "<", right) || this.compare(left, "==", right);
  }
  "raw>="(left: Comparable, right: Comparable): boolean {
    return this.compare(left, ">", right) || this.compare(left, "==", right);
  }
  rawin(left: Comparable, right: Comparable[]): boolean {
    return right.some((value) => this.compare(left, "==", right));
  }
  "raw!="(left: Comparable, right: Comparable): boolean {
    return !this.compare(left, "==", right);
  }

  "raw=="(left: Comparable, right: Comparable): boolean {
    if (this.isEmpty(left) && this.isEmpty(right)) {
      return true;
    }
    if (this.isEmpty(left) || this.isEmpty(right)) {
      return false;
    }
    return left === right;
  }
  "raw<"(left: Comparable, right: Comparable): boolean {
    if ((this.isEmpty(left) && this.isEmpty(right)) || this.isEmpty(right)) {
      return false;
    }
    if (this.isEmpty(left)) {
      return true;
    }
    return left < right;
  }
  "raw>"(left: Comparable, right: Comparable): boolean {
    if ((this.isEmpty(left) && this.isEmpty(right)) || this.isEmpty(left)) {
      return false;
    }
    if (this.isEmpty(right)) {
      return true;
    }
    return left > right;
  }

  abstract "=="(left: SafeComparable, right: SafeComparable): boolean;
  abstract ">"(left: SafeComparable, right: SafeComparable): boolean;
  abstract "<"(left: SafeComparable, right: SafeComparable): boolean;
}

export class Comparator extends AbstractComparator {
  public "=="(left: SafeComparable, right: SafeComparable) {
    return left === right;
  }
  public "<"(left: SafeComparable, right: SafeComparable) {
    return left < right;
  }
  public ">"(left: SafeComparable, right: SafeComparable) {
    return left > right;
  }
}
