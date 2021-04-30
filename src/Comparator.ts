import { ComparatorInterface, Comparators } from "./contracts/Comparator";
export type Comparable = unknown;
export type SafeComparable = string | number | boolean | object;

export type ComparatorContext = {
  target: string;
  options: ComparatorOptions;
};

export type ComparatorOptions = {
  nullOrdering: "first" | "last" | "throw";
};

export class InvalidNullComparison extends Error {
  static message: "Invalid null comparison";
  constructor() {
    super(InvalidNullComparison.message);
  }
}

export abstract class AbstractComparator implements ComparatorInterface {
  constructor(public context: ComparatorContext) {}

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
    return right.some((value) => this.compare(left, "==", value));
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

    return this["=="](left, right);
  }
  "raw<"(left: Comparable, right: Comparable): boolean {
    if (this.context.options.nullOrdering == "throw" && (this.isEmpty(left) || this.isEmpty(right))) {
      throw new InvalidNullComparison();
    }
    if (this.isEmpty(left) && this.isEmpty(right)) {
      return false;
    }
    if (this.isEmpty(left)) {
      return this.context.options.nullOrdering == "first";
    }
    if (this.isEmpty(right)) {
      return this.context.options.nullOrdering == "last";
    }
    return this["<"](left, right);
  }
  "raw>"(left: Comparable, right: Comparable): boolean {
    if (this.context.options.nullOrdering == "throw" && (this.isEmpty(left) || this.isEmpty(right))) {
      throw new InvalidNullComparison();
    }
    if (this.isEmpty(left) && this.isEmpty(right)) {
      return false;
    }
    if (this.isEmpty(right)) {
      return this.context.options.nullOrdering == "first";
    }
    if (this.isEmpty(left)) {
      return this.context.options.nullOrdering == "last";
    }
    return this[">"](left, right);
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
