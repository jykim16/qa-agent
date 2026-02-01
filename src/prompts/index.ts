import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const load = (name: string) => readFileSync(join(__dirname, `${name}.txt`), "utf-8").trim();

export const TEST_PLAN_GENERATION = load("test-plan-generation");
export const ASSERTION_EVALUATION = load("assertion-evaluation");
