import { NormalizedQuery, NormalizedSubQuery, Queryable } from "@opaquejs/query";
import { QueryEngine } from "./QueryEngine";

export const defaultQueryEngine = new QueryEngine();

export const matchesQuery = (subject: Queryable, query: NormalizedSubQuery): boolean =>
  defaultQueryEngine.matchesQuery(subject, query);

export const queryCollection = (subjects: Queryable[], query: NormalizedQuery) =>
  defaultQueryEngine.queryCollection(subjects, query);
