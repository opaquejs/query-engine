import { NormalizedQuery, NormalizedSubQuery, Queryable } from "@opaquejs/query";
import { Comparator } from "./Comparator";
import { ComparatorInterface } from "./contracts/Comparator";

export class QueryEngine {
  constructor(public comparators: Record<string, (value: unknown) => ComparatorInterface> = {}) {}

  makeComparator({ target, value }: { target: string; value: unknown }): ComparatorInterface {
    if (this.comparators[target]) {
      return this.comparators[target](value);
    }
    return new Comparator(value);
  }

  matchesQuery(subject: Queryable, query: NormalizedSubQuery): boolean {
    if ("key" in query) {
      return this.makeComparator({ target: query["key"], value: subject[query.key] }).compare(
        query.comparator,
        query.value
      );
    }
    if ("_and" in query) {
      return query._and.every((query) => this.matchesQuery(subject, query));
    }
    if ("_or" in query) {
      return query._or.some((query) => this.matchesQuery(subject, query));
    }
    // Query is empty -> no restrictions
    return true;
  }
  queryCollection(subjects: Queryable[], query: NormalizedQuery) {
    return subjects
      .filter((subject) => this.matchesQuery(subject, query))
      .slice(query._skip != undefined ? Math.max(query._skip, 0) : 0)
      .slice(0, query._limit != undefined ? Math.max(query._limit, 0) : undefined);
  }
}
