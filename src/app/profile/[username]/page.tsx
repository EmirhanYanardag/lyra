import { AppShell } from "@/components/layout/app-shell";
import { ProfileView } from "@/components/profile/profile-view";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <AppShell>
      <ProfileView username={username} />
    </AppShell>
  );
}
