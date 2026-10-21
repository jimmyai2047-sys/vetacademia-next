import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The signed-in user's own Expert row (finding 14): navigation labelled
// "My Profile" must land on this person, not the public /experts directory.
// Returns { expert: null } for users without a profile row (self-registered
// expert-role accounts) so callers can offer the apply/editor path instead.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ expert: null });
    }
    const expert = await prisma.expert.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isAvailable: true },
    });
    return NextResponse.json({ expert });
  } catch (error) {
    console.error("Experts me error:", error);
    return NextResponse.json({ expert: null });
  }
}
