import { t } from "@tbsten/mir-core";
import * as logger from "./logger.js";
import {
  saveInstallFailures,
  type FailedSnippetEntry,
} from "./install-failures.js";

export type BatchItemStatus = "success" | "failure" | "skipped";

export interface BatchSummaryItem {
  name: string;
  status: BatchItemStatus;
  error?: string;
}

export function printBatchSummary(items: BatchSummaryItem[]): void {
  const successCount = items.filter((item) => item.status === "success").length;
  const failureCount = items.filter((item) => item.status === "failure").length;
  const skippedCount = items.filter((item) => item.status === "skipped").length;
  const total = items.length;

  logger.info("");
  logger.info(t("batch-summary.results"));

  for (const item of items) {
    const emoji =
      item.status === "success" ? "✅" : item.status === "failure" ? "❌" : "⏭️ ";
    const status =
      item.status === "success"
        ? t("batch-summary.success")
        : item.status === "failure"
          ? t("batch-summary.failure")
          : t("batch-summary.skipped");

    const errorText = item.error ? ` (${item.error})` : "";
    logger.info(`${emoji} ${item.name.padEnd(30)} ${status}${errorText}`);
  }

  logger.info("");
  logger.info(
    t("batch-summary.counts", {
      success: successCount,
      failure: failureCount,
      skipped: skippedCount,
      total,
    }),
  );

  // Save failed snippets for --retry-failed
  if (failureCount > 0) {
    const failedEntries: FailedSnippetEntry[] = items
      .filter((item) => item.status === "failure")
      .map((item) => ({
        name: item.name,
        error: item.error ?? "Unknown error",
        timestamp: Date.now(),
      }));

    saveInstallFailures(failedEntries);
    logger.info("");
    logger.info(t("batch-summary.retry-hint"));
  }
}
