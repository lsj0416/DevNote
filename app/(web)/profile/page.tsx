import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/domain/user/user-service";
import { ProfileForm } from "@/components/user/ProfileForm";
import { DeleteAccountButton } from "@/components/user/DeleteAccountButton";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    redirect("/");
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>내 프로필</h1>
      <dl>
        <dt>Email</dt>
        <dd>{profile.email ?? "-"}</dd>
        <dt>가입일</dt>
        <dd>{profile.createdAt.toISOString()}</dd>
      </dl>
      <ProfileForm initialUsername={profile.username} />
      <hr style={{ margin: "2rem 0" }} />
      <DeleteAccountButton />
    </main>
  );
}
