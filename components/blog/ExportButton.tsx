"use client";

import { useState } from "react";

export function ExportButton({ noteId }: { noteId: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setErrorMessage(null);

    const res = await fetch(`/api/notes/${noteId}/blog-draft/export`, { method: "POST" });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setErrorMessage(body?.message ?? "다운로드에 실패했습니다.");
      setIsExporting(false);
      return;
    }

    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = /filename="([^"]+)"/.exec(disposition);
    const filename = match?.[1] ?? "blog-draft.md";

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  }

  return (
    <div>
      <button type="button" onClick={handleExport} disabled={isExporting}>
        Markdown 다운로드
      </button>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </div>
  );
}
