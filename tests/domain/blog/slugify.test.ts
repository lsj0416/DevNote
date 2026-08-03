import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/domain/blog/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates a simple English title", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("preserves Korean characters instead of stripping them", () => {
    // Regression test: NFKD decomposes Hangul syllables into individual jamo,
    // which fall outside the 가-힣 allow-list range. Without recomposing via
    // NFC afterward, every Korean title collapsed to "untitled".
    expect(slugify("한글 제목 테스트")).toBe("한글-제목-테스트");
  });

  it("strips Latin accents", () => {
    expect(slugify("café/naïve résumé")).toBe("cafe-naive-resume");
  });

  it("falls back to 'untitled' for a blank or symbol-only title", () => {
    expect(slugify("   ")).toBe("untitled");
    expect(slugify("!!!")).toBe("untitled");
  });

  it("handles mixed Korean/English titles", () => {
    expect(slugify("Next.js 학습 노트: React & TypeScript")).toBe(
      "next-js-학습-노트-react-typescript"
    );
  });
});
