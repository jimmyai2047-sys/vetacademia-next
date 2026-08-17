import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { issueSignedToken } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const filename = body.filename as string;
    if (!filename) {
      return NextResponse.json({ error: "filename required" }, { status: 400 });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `uploads/${Date.now()}-${safeName}`;
    const token = process.env.BLOB_READ_WRITE_TOKEN!;

    const issued = await issueSignedToken({
      token,
      pathname,
      operations: ["put"],
    });

    return NextResponse.json({
      clientToken: issued.clientSigningToken,
      delegationToken: issued.delegationToken,
      pathname,
    });
  } catch (error) {
    console.error("Client token error:", error);
    const message = error instanceof Error ? error.message : "Token failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
