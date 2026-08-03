/** Converts a title into a safe filename slug, preserving Korean characters. */
export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks (Latin accents)
    .normalize("NFC") // recompose Hangul syllables decomposed by NFKD above
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled";
}
