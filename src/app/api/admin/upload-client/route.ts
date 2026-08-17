import { handleUpload } from "@vercel/blob/client";
import { getAdminSession } from "@/lib/admin";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const result = await handleUpload({
    body,
    request,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    onBeforeGenerateToken: async () => ({
      allowOverwrite: false,
    }),
    onUploadCompleted: async () => {},
  });

  return Response.json(result);
}
