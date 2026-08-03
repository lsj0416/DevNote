"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAccountButton() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "정말로 계정을 삭제하시겠습니까? 모든 분석 기록, 노트, 블로그 초안이 함께 삭제되며 되돌릴 수 없습니다."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setErrorMessage(null);

    const res = await fetch("/api/users/me", { method: "DELETE" });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setErrorMessage(body?.message ?? "계정 삭제에 실패했습니다.");
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDelete} disabled={isDeleting}>
        회원 탈퇴
      </button>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </div>
  );
}
