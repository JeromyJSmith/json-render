import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Production: Serve HTML slides from public/slides/ directory
// Development: Can fall back to local development path if configured
const PRODUCTION_SLIDES_DIR = join(process.cwd(), "public", "slides");
const DEV_SLIDES_DIR = process.env.DEV_SLIDES_DIR || "";

function getSlidesDir(): string {
  // In production or when public/slides exists, use that
  if (existsSync(PRODUCTION_SLIDES_DIR)) {
    return PRODUCTION_SLIDES_DIR;
  }
  // In development, fall back to configured path
  if (DEV_SLIDES_DIR && existsSync(DEV_SLIDES_DIR)) {
    return DEV_SLIDES_DIR;
  }
  return PRODUCTION_SLIDES_DIR;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent path traversal attacks
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, "");
    if (sanitizedFilename !== filename) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const slidesDir = getSlidesDir();
    const filePath = join(slidesDir, sanitizedFilename);

    // Ensure the resolved path is still within the slides directory
    if (!filePath.startsWith(slidesDir)) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const content = await readFile(filePath, "utf-8");

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving slide:", error);
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head><title>Slide Not Found</title></head>
<body style="background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui;">
  <div style="text-align:center;">
    <h1 style="color:#FF6B6B;">Slide Not Available</h1>
    <p>Please ensure slides are deployed to public/slides/</p>
  </div>
</body>
</html>`,
      {
        status: 404,
        headers: { "Content-Type": "text/html" },
      },
    );
  }
}
