import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUploadSignature } from "@/lib/cloudinary";

export async function POST(request: Request) {
  // Ensure only logged-in administrators can request upload signatures
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const folder = body.folder || "kinetic_code_labs";
    const signatureData = getUploadSignature(folder);
    return NextResponse.json(signatureData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
