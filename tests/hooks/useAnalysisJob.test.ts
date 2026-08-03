import { describe, expect, it } from "vitest";
import { isTerminalStatus } from "@/hooks/useAnalysisJob";

describe("isTerminalStatus", () => {
  it.each(["COMPLETED", "FAILED"] as const)(
    "treats %s as terminal (polling should stop)",
    (status) => {
      expect(isTerminalStatus(status)).toBe(true);
    }
  );

  it.each(["PENDING", "PROCESSING"] as const)(
    "treats %s as non-terminal (polling should continue)",
    (status) => {
      expect(isTerminalStatus(status)).toBe(false);
    }
  );
});
