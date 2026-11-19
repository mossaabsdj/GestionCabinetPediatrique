import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolveUploadedFilePath, getMimeType } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const fileSegments = resolvedParams?.file || [];
    const relativePath = Array.isArray(fileSegments)
      ? fileSegments.join("/")
      : String(fileSegments);

    if (!relativePath) {
      return new NextResponse("File parameter required", { status: 400 });
    }

    const resolved = resolveUploadedFilePath(relativePath);

    if (!resolved.exists || !existsSync(resolved.absolutePath)) {
      return new NextResponse("File not found in public/uploads", { status: 404 });
    }

    const fileBuffer = await readFile(resolved.absolutePath);
    const contentType = getMimeType(resolved.absolutePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("[app/uploads] Error streaming uploaded file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
