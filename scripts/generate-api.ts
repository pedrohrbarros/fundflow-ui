import openapiTS, { astToString } from "openapi-typescript";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const endpoint = `${API_URL}/openapi/json`;
const outputPath = resolve(import.meta.dir, "../types/api-types.ts");

console.log(`Fetching OpenAPI spec from ${endpoint}...`);

let ast;
try {
  ast = await openapiTS(new URL(endpoint));
} catch (err) {
  console.error(`Failed to fetch spec from ${endpoint}`);
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const content = astToString(ast);
mkdirSync(resolve(import.meta.dir, "../types"), { recursive: true });
writeFileSync(outputPath, content, "utf-8");

console.log(`Generated types/api-types.ts`);
