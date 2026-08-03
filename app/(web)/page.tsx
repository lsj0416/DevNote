import Link from "next/link";
import { auth } from "@/lib/auth";
import { LoginButton } from "@/components/auth/LoginButton";

export default async function Home() {
  const session = await auth();

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "4rem 1rem" }}>
      <h1>DevNote AI</h1>
      <p>GitHub repo를 분석해 AI 학습 노트와 블로그 초안을 생성합니다.</p>
      {session?.user ? (
        <Link href="/analysis">내 분석으로 이동</Link>
      ) : (
        <LoginButton />
      )}
    </main>
  );
}
