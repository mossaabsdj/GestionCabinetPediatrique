import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { writeFile, mkdir, unlink, readdir, stat } from "fs/promises";
import {
  getUploadsDir,
  sanitizeFilename,
  resolveUploadedFilePath,
  getMimeType,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";

// Ensure the uploads directory exists with full permissions
const ensureUploadsDir = async (uploadDir) => {
  try {
    await mkdir(uploadDir, { recursive: true, mode: 0o777 });
    try {
      fs.chmodSync(uploadDir, 0o777);
    } catch (_) {}
  } catch (error) {
    console.error("[api/upload] Error creating uploads directory:", error);
  }
};

/**
 * POST /api/upload
 * Saves uploaded image/document directly inside root application's public/uploads/ directory.
 */
export const POST = async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier reçu (paramètre 'file' manquant)." },
        { status: 400 },
      );
    }

    const uploadDir = getUploadsDir();
    await ensureUploadsDir(uploadDir);

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawName = file.name || "upload.bin";
    const filename = sanitizeFilename(rawName);
    const filePath = path.join(uploadDir, filename);

    // Save file with explicit write permissions
    await writeFile(filePath, buffer, { mode: 0o666 });
    try {
      fs.chmodSync(filePath, 0o666);
    } catch (_) {}

    console.log("[api/upload] File saved successfully to:", filePath);

    return NextResponse.json(
      {
        success: true,
        message: "Fichier téléversé avec succès.",
        filename,
        url: `/uploads/${filename}`,
        path: filePath,
        size: buffer.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/upload] Error writing file:", error);
    return NextResponse.json(
      { error: "Échec du téléversement du fichier : " + error.message },
      { status: 500 },
    );
  }
};

/**
 * GET /api/upload
 * Queries uploaded files or checks file existence.
 */
export const GET = async (req) => {
  try {
    const url = new URL(req.url);
    const queryFile = url.searchParams.get("file");

    if (queryFile) {
      const resolved = resolveUploadedFilePath(queryFile);
      if (!resolved.exists) {
        return NextResponse.json(
          { exists: false, error: "Fichier non trouvé." },
          { status: 404 },
        );
      }
      const st = await stat(resolved.absolutePath);
      return NextResponse.json({
        exists: true,
        filename: resolved.filename,
        url: resolved.relativeUrl,
        path: resolved.absolutePath,
        size: st.size,
        mimeType: getMimeType(resolved.absolutePath),
        lastModified: st.mtime,
      });
    }

    // List all files in public/uploads/
    const uploadDir = getUploadsDir();
    await ensureUploadsDir(uploadDir);
    const files = await readdir(uploadDir);
    const list = files.map((f) => ({
      filename: f,
      url: `/uploads/${f}`,
      mimeType: getMimeType(f),
    }));

    return NextResponse.json({ success: true, count: list.length, files: list });
  } catch (error) {
    console.error("[api/upload] GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture des fichiers : " + error.message },
      { status: 500 },
    );
  }
};

/**
 * DELETE /api/upload?file=filename
 * Safely removes a file from public/uploads/
 */
export const DELETE = async (req) => {
  try {
    const url = new URL(req.url);
    const queryFile = url.searchParams.get("file");

    if (!queryFile) {
      return NextResponse.json(
        { error: "Nom du fichier à supprimer requis." },
        { status: 400 },
      );
    }

    const resolved = resolveUploadedFilePath(queryFile);
    if (!resolved.exists) {
      return NextResponse.json(
        { error: "Le fichier n'existe pas." },
        { status: 404 },
      );
    }

    await unlink(resolved.absolutePath);
    return NextResponse.json({
      success: true,
      message: "Fichier supprimé avec succès.",
      filename: resolved.filename,
    });
  } catch (error) {
    console.error("[api/upload] DELETE error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression : " + error.message },
      { status: 500 },
    );
  }
};
