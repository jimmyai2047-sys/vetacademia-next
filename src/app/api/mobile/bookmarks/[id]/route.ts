import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { removeBookmark } from "@/lib/bookmarks-service";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await ctx.params;
    await removeBookmark({ userId, id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Mobile bookmark DELETE error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
