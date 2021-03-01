import { OpaqueAttributes } from "@opaquejs/opaque/lib/contracts/ModelContracts";
import { ComparisonTypes, NormalizedQuery, NormalizedSubQuery } from "@opaquejs/query";

export type ComparisonFunctions<Value> = {
  [P in keyof ComparisonTypes<Value>]: (right: ComparisonTypes<Value>[P]) => boolean;
};

export const comparisonFunctions = <Value>(left: Value) =>
  ({
    "==": (right) => left === right,
    ">": (right) => left > right,
    ">=": (right) => left >= right,
    "<": (right) => left < right,
    "<=": (right) => left <= right,
    "!=": (right) => left !== right,
    in: (right) => right.includes(left),
  } as ComparisonFunctions<Value>);

export const matchesComparison = <Value, C extends ComparisonTypes<Value>, PC extends keyof C>(
  left: Value,
  comparison: PC,
  right: C[PC]
) => {
  return (comparisonFunctions(left) as any)[comparison](right) as boolean;
};

export const matchesQuery = (subject: OpaqueAttributes, query: NormalizedSubQuery): boolean => {
  if ("key" in query) {
    return matchesComparison(subject[query.key], query.comparator, query.value);
  }
  if ("_and" in query) {
    return query._and.every((query) => matchesQuery(subject, query));
  }
  if ("_or" in query) {
    return query._or.some((query) => matchesQuery(subject, query));
  }
  // Query is empty -> no restrictions
  return true;
};

export const queryCollection = (subjects: OpaqueAttributes[], query: NormalizedQuery) => {
  return subjects
    .filter((subject) => matchesQuery(subject, query))
    .slice(query._skip != undefined ? Math.max(query._skip, 0) : 0)
    .slice(0, query._limit != undefined ? Math.max(query._limit, 0) : undefined);
};
