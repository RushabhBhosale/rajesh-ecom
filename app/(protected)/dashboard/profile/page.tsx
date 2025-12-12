import { redirect } from "next/navigation";

import { ProfilePage } from "@/components/dashboard/profile-page";
import { getCurrentUser } from "@/lib/auth";

export default async function Profile() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/dashboard/profile");
  }

  return <ProfilePage user={user} />;
}
