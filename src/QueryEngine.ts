import { NormalizedQuery, NormalizedSubQuery, OrderEntry, Queryable } from "@opaquejs/query";
import { Comparator, ComparatorContext, ComparatorOptions, InvalidNullComparison } from "./Comparator";
import { ComparatorInterface } from "./contracts/Comparator";

export type Mode = "sql" | "dynamic";

export const modeOptions: Record<Mode, ComparatorOptions> = {
  sql: {
    nullOrdering: "throw",
  },
  dynamic: {
    nullOrdering: "first",
  },
};

export class QueryEngine {
  public mode: Mode;
  public comparators: Record<string, (ctx: ComparatorContext) => ComparatorInterface>;
  constructor({
    comparators = {},
    mode = "sql",
  }: {
    comparators?: QueryEngine["comparators"];
    mode?: QueryEngine["mode"];
  } = {}) {
    this.comparators = comparators;
    this.mode = mode;
  }

  makeComparator(ctx: ComparatorContext): ComparatorInterface {
    if (this.comparators[ctx.target]) {
      return this.comparators[ctx.target](ctx);
    }
    return new Comparator(ctx);
  }

  matchesQuery(subject: Queryable, query: NormalizedSubQuery, wrapped = false): boolean {
    if (!wrapped) {
      try {
        return this.matchesQuery(subject, query, true);
      } catch (error) {
        if (error instanceof InvalidNullComparison) {
          return false;
        }
        throw error;
      }
    }
    if ("key" in query) {
      return this.makeComparator({
        target: query["key"],
        options: modeOptions[this.mode],
      }).compare(subject[query.key], query.comparator, query.value);
    }
    if ("_and" in query) {
      return query._and.every((query) => this.matchesQuery(subject, query));
    }
    if ("_or" in query) {
      return query._or.some((query) => this.matchesQuery(subject, query));
    }
    if ("_not" in query) {
      return !this.matchesQuery(subject, query._not, wrapped);
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
      const comparator = this.makeComparator({ target: current.key, options: { nullOrdering: "first" } });

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

    if (query._orderBy) {
      subjects = subjects.sort(this.orderCallback(query._orderBy));
    }
    if (query._skip != undefined) {
      subjects = subjects.slice(Math.max(query._skip, 0));
    }
    if (query._limit != undefined) {
      subjects = subjects.slice(0, Math.max(query._limit, 0));
    }

    return subjects;
  }
}
