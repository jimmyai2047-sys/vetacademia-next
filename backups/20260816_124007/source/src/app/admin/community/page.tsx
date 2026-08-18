import { requireAdmin } from "@/lib/admin";
import CommunityManager from "@/components/admin/community-manager";

export const metadata = { title: "Community Links | Admin" };

export default async function AdminCommunityPage() {
  await requireAdmin();
  return <CommunityManager />;
}
