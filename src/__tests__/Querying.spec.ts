import { NormalizedQuery } from "@opaquejs/query";
import { runAsTest } from "@opaquejs/testing";
import { matchesQuery, queryCollection, QueryEngine } from "..";
import { Comparator } from "../Comparator";
import { Comparators } from "../contracts/Comparator";

@runAsTest()
export class Querying {
  matchesQuery() {
    // ==
    expect(matchesQuery({ lel: "hallo" }, { key: "lel", comparator: "==", value: "hallo" })).toBe(true);
    expect(matchesQuery({ lel: "hallo" }, { key: "lel", comparator: "==", value: "halli" })).toBe(false);
    expect(matchesQuery({ lel: 1 }, { key: "lel", comparator: "==", value: "1" })).toBe(false); // Strict equal

    // !=
    expect(matchesQuery({ lel: "hallo" }, { key: "lel", comparator: "!=", value: "halli" })).toBe(true);
    expect(matchesQuery({ lel: "hallo" }, { key: "lel", comparator: "!=", value: "hallo" })).toBe(false);
    expect(matchesQuery({ lel: 1 }, { key: "lel", comparator: "!=", value: "1" })).toBe(true); // Strict unequal

    // >
    expect(matchesQuery({ lel: 2 }, { key: "lel", comparator: ">", value: 1 })).toBe(true);
    expect(matchesQuery({ lel: 1 }, { key: "lel", comparator: ">", value: 1 })).toBe(false);
    expect(matchesQuery({ lel: 0 }, { key: "lel", comparator: ">", value: 1 })).toBe(false);

    // >=
    expect(matchesQuery({ lel: 2 }, { key: "lel", comparator: ">=", value: 1 })).toBe(true);
    expect(matchesQuery({ lel: 1 }, { key: "lel", comparator: ">=", value: 1 })).toBe(true);
    expect(matchesQuery({ lel: 0 }, { key: "lel", comparator: ">=", value: 1 })).toBe(false);

    // <
    expect(matchesQuery({ lel: 2 }, { key: "lel", comparator: "<", value: 1 })).toBe(false);
    expect(matchesQuery({ lel: 1 }, { key: "lel", comparator: "<", value: 1 })).toBe(false);
    expect(matchesQuery({ lel: 0 }, { key: "lel", comparator: "<", value: 1 })).toBe(true);

    // <=
    expect(matchesQuery({ lel: 2 }, { key: "lel", comparator: "<=", value: 1 })).toBe(false);
    expect(matchesQuery({ lel: 1 }, { key: "lel", comparator: "<=", value: 1 })).toBe(true);
    expect(matchesQuery({ lel: 0 }, { key: "lel", comparator: "<=", value: 1 })).toBe(true);

    // complex
    const query: NormalizedQuery<{
      str: string;
      bool: boolean;
      num: number;
    }> = {
      _and: [
        { key: "bool", comparator: "==", value: true },
        {
          _or: [
            { key: "str", comparator: "==", value: "approved" },
            { key: "num", comparator: ">", value: 0 },
          ],
        },
      ],
    };

    expect(matchesQuery({ bool: true, str: "approved", num: 0 }, query)).toBe(true);
    expect(matchesQuery({ bool: true, str: "no :(", num: 1 }, query)).toBe(true);
    expect(matchesQuery({ bool: true, str: "approved", num: 1 }, query)).toBe(true);

    expect(matchesQuery({ bool: false, str: "approved", num: 1 }, query)).toBe(false);
    expect(matchesQuery({ bool: false, str: "approved", num: 0 }, query)).toBe(false);
    expect(matchesQuery({ bool: false, str: "no :(", num: 1 }, query)).toBe(false);
    expect(matchesQuery({ bool: false, str: "no :(", num: 0 }, query)).toBe(false);
    expect(matchesQuery({ bool: true, str: "no :(", num: 0 }, query)).toBe(false);
  }
  queryCollection() {
    const collection = [{ lel: "hallo1" }, { lel: "hallo2" }, { lel: "hallo3" }];
    expect(queryCollection(collection, { _limit: 1 })).toEqual([{ lel: "hallo1" }]);
    expect(queryCollection(collection, { _limit: 2, _skip: 2 })).toEqual([{ lel: "hallo3" }]);
    expect(queryCollection(collection, { _skip: 5 })).toEqual([]);
    expect(queryCollection(collection, { _limit: 0 })).toEqual([]);
    expect(queryCollection(collection, { _limit: -1 })).toEqual([]);
    expect(queryCollection(collection, { _limit: Infinity })).toEqual([
      { lel: "hallo1" },
      { lel: "hallo2" },
      { lel: "hallo3" },
    ]);
    expect(queryCollection(collection, { _skip: Infinity })).toEqual([]);

    expect(queryCollection(collection, { key: "lel", comparator: "==", value: "hallo1" })).toEqual([{ lel: "hallo1" }]);
    expect(queryCollection(collection, { key: "lel", comparator: "==", value: "hallo2" })).toEqual([{ lel: "hallo2" }]);
    expect(queryCollection(collection, { key: "lel", comparator: "==", value: "hallo3" })).toEqual([{ lel: "hallo3" }]);
    expect(queryCollection(collection, { key: "lel", comparator: "!=", value: "hallo3" })).toEqual([
      { lel: "hallo1" },
      { lel: "hallo2" },
    ]);
  }
  queryWithDatetimeComparisons() {
    class DateComparator extends Comparator<Date> {
      constructor(left: unknown) {
        super(DateComparator.parseDate(left));
      }

      static parseDate(value: unknown) {
        if (typeof value != "string") {
          throw new Error(`A date value must be given as a string, received value [${value}] in date comparison`);
        }
        return new Date(value);
      }

      compare(comparison: Comparators, right: unknown) {
        return super.compare(comparison, DateComparator.parseDate(right));
      }
    }
    const engine = new QueryEngine({ createdAt: (value) => new DateComparator(value) });

    // Works normal
    expect(() => engine.matchesQuery({ number: 1 }, { key: "number", comparator: "==", value: 2 })).not.toThrow();

    // wrong date input
    expect(() =>
      engine.matchesQuery({ createdAt: {} }, { key: "createdAt", comparator: ">", value: "Sat Apr 9 2021" })
    ).toThrow();

    // Correct
    expect(
      engine.matchesQuery(
        { createdAt: "2021-04-09T22:28:29.954Z" },
        { key: "createdAt", comparator: ">", value: "Sat Apr 9 2021" }
      )
    ).toBe(true);
    // Incorrect
    expect(
      engine.matchesQuery(
        { createdAt: "2021-03-09T22:28:29.954Z" },
        { key: "createdAt", comparator: ">", value: "Sat Apr 9 2021" }
      )
    ).toBe(false);
  }
}
