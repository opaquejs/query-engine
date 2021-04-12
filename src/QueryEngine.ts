import { NormalizedQuery, NormalizedSubQuery, OrderEntry, Queryable } from "@opaquejs/query";
import { Comparator } from "./Comparator";
import { ComparatorInterface } from "./contracts/Comparator";

export class QueryEngine {
  constructor(public comparators: Record<string, () => ComparatorInterface> = {}) {}

  makeComparator({ target }: { target: string }): ComparatorInterface {
    if (this.comparators[target]) {
      return this.comparators[target]();
    }
    return new Comparator();
  }

  matchesQuery(subject: Queryable, query: NormalizedSubQuery): boolean {
    if ("key" in query) {
      return this.makeComparator({ target: query["key"] }).compare(subject[query.key], query.comparator, query.value);
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
  orderCallback(orderBy: OrderEntry[]) {
    return (a: Queryable, b: Queryable): -1 | 0 | 1 => {
      const current = orderBy[0];
      if (current == undefined) {
        return 0;
      }

      const aval = a[current.key];
      const bval = b[current.key];
      const comparator = this.makeComparator({ target: current.key });

      if (comparator.compare(aval, "==", bval)) {
        return this.orderCallback(orderBy.slice(1))(a, b);
      }
      if (comparator.compare(aval, ">", bval)) {
        return current.direction == "asc" ? 1 : -1;
      }
      if (comparator.compare(aval, "<", bval)) {
        return current.direction == "asc" ? -1 : 1;
      }
      return 0;
    };
  }
  queryCollection(subjects: Queryable[], query: NormalizedQuery) {
    subjects = subjects.filter((subject) => this.matchesQuery(subject, query));

    if (query._skip != undefined) {
      subjects = subjects.slice(Math.max(query._skip, 0));
    }
    if (query._limit != undefined) {
      subjects = subjects.slice(0, Math.max(query._limit, 0));
    }
    if (query._orderBy) {
      subjects = subjects.sort(this.orderCallback(query._orderBy));
    }

    return subjects;
  }
}
