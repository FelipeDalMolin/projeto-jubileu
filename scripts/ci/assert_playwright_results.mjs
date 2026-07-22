#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const reportPath = process.argv[2];
if (!reportPath) {
  throw new Error("usage: assert_playwright_results.mjs <results.json>");
}

const report = JSON.parse(await readFile(reportPath, "utf8"));
const stats = report.stats ?? {};
const total = Number(stats.expected ?? 0) + Number(stats.unexpected ?? 0) +
  Number(stats.flaky ?? 0) + Number(stats.skipped ?? 0);

if (total === 0) {
  throw new Error(`No Playwright tests were recorded in ${reportPath}.`);
}
if (Number(stats.skipped ?? 0) !== 0) {
  throw new Error(`Unexpected Playwright skips: ${stats.skipped} of ${total}.`);
}
if (Number(stats.unexpected ?? 0) !== 0 || Number(stats.flaky ?? 0) !== 0) {
  throw new Error(
    `Playwright result is not clean: unexpected=${stats.unexpected ?? 0}, flaky=${stats.flaky ?? 0}.`,
  );
}

console.log(`Playwright gate OK: ${stats.expected} passed, 0 skipped, 0 flaky.`);
