import { ComparatorInterface, Comparators } from "./contracts/Comparator";

export class Comparator<Value = unknown> implements ComparatorInterface {
  constructor(public left: Value) {}

  compare(comparison: Comparators, right: Value) {
    if (comparison == "in") {
      if (!Array.isArray(right)) {
        throw new Error(
          `Comparator: value [${right}] is not an array and it can therefore not be checked if [${this.left}] is inside of this`
        );
      }
      return this.in(right);
    }
    return this[comparison](right);
  }

  "=="(right: Value) {
    return this.left === right;
  }
  "!="(right: Value) {
    return this.left !== right;
  }
  "<"(right: Value) {
    return this.left < right;
  }
  "<="(right: Value) {
    return this.left <= right;
  }
  ">"(right: Value) {
    return this.left > right;
  }
  ">="(right: Value) {
    return this.left >= right;
  }
  in(right: Value[]) {
    return right.includes(this.left);
  }
}
