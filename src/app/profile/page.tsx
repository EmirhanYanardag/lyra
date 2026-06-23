import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/lyra/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfileRedirectPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth?mode=signin");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?mode=signin");
  }

  const profile = await getCurrentProfile();

  if (profile) {
    redirect(`/profile/${profile.username}`);
  }

  redirect("/agents");
}
