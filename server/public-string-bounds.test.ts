import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("public-facing tRPC string input bounds", () => {
  it("gives every inline public string field an explicit practical maximum", () => {
    const starts = [...source.matchAll(/publicProcedure/g)].map(match => match.index!);
    const unbounded: string[] = [];

    for (const start of starts) {
      const query = source.indexOf(".query(", start);
      const mutation = source.indexOf(".mutation(", start);
      const end = Math.min(...[query, mutation].filter(index => index >= 0));
      const block = source.slice(start, end);
      for (const match of block.matchAll(/z\.string\(\)((?:\s*\.[a-zA-Z]+\([^)]*\))*)/g)) {
        if (!match[1].includes(".max(")) {
          unbounded.push(`line ${source.slice(0, start + match.index!).split("\n").length}`);
        }
      }
    }

    expect(unbounded).toEqual([]);
  });

  it("audits extracted schemas used by public-facing PII procedures, including protected claims.submit", () => {
    const schemaStarts = [...source.matchAll(/export const (\w+InputSchema) = z\.object\(\{/g)];
    const unbounded: string[] = [];
    for (const schema of schemaStarts) {
      const start = schema.index!;
      const end = source.indexOf("\n});", start);
      const block = source.slice(start, end);
      for (const match of block.matchAll(/z\.string\(\)((?:\s*\.[a-zA-Z]+\([^)]*\))*)/g)) {
        if (!match[1].includes(".max(")) unbounded.push(`${schema[1]}:${match[0]}`);
      }
    }

    expect(source).toMatch(/claims: router\([\s\S]*?submit: protectedProcedure[\s\S]*?\.input\(businessClaimInputSchema\)/);
    expect(unbounded).toEqual([]);
  });
});