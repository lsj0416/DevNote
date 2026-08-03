import { signIn } from "@/lib/auth";

export function LoginButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/analysis" });
      }}
    >
      <button type="submit">GitHub로 로그인</button>
    </form>
  );
}
