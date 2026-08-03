"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "이 노트를 삭제하시겠습니까? 연관된 블로그 초안도 함께 삭제되며 되돌릴 수 없습니다."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setErrorMessage(null);

    const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });

    if (res.ok) {
      router.push("/notes");
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setErrorMessage(body?.message ?? "노트 삭제에 실패했습니다.");
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDelete} disabled={isDeleting}>
        노트 삭제
      </button>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </div>
  );
}
