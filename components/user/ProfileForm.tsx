"use client";

import { useState, type FormEvent } from "react";

export function ProfileForm({ initialUsername }: { initialUsername: string }) {
  const [username, setUsername] = useState(initialUsername);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const body = await res.json();

    if (res.ok && body.success) {
      setUsername(body.data.username);
      setStatus("saved");
    } else {
      setErrorMessage(body.message ?? "저장에 실패했습니다.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Username
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={100}
        />
      </label>
      <button type="submit" disabled={status === "saving"}>
        저장
      </button>
      {status === "saved" && <p>저장되었습니다.</p>}
      {status === "error" && <p role="alert">{errorMessage}</p>}
    </form>
  );
}
