import { describe, expect, it } from "vitest";
import { isValidGithubRepoUrl, parseGithubRepoUrl } from "@/lib/domain/analysis/validate-repo-url";

describe("validate-repo-url", () => {
  it.each([
    "https://github.com/vercel/next.js",
    "https://github.com/vercel/next.js.git",
    "https://github.com/vercel/next.js/",
    "https://github.com/vercel/next.js.git/",
  ])("accepts %s", (url) => {
    expect(isValidGithubRepoUrl(url)).toBe(true);
  });

  it("parses owner/repo out of a valid URL", () => {
    expect(parseGithubRepoUrl("https://github.com/vercel/next.js.git")).toEqual({
      owner: "vercel",
      repo: "next.js",
    });
  });

  it.each([
    "",
    "not-a-url",
    "http://github.com/vercel/next.js",
    "https://gitlab.com/vercel/next.js",
    "https://github.com/vercel",
    "https://github.com/",
  ])("rejects %s", (url) => {
    expect(isValidGithubRepoUrl(url)).toBe(false);
  });
});
