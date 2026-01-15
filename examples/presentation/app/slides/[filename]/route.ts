import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

// Serve HTML slides from the MARPA presentation folder
const SLIDES_DIR =
  "/Users/ojeromyo/Desktop/_marpa_final/NEW_UPDATE_PRESENTATION_files";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    const filePath = join(SLIDES_DIR, filename);

    const content = await readFile(filePath, "utf-8");

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error serving slide:", error);
    return new NextResponse("Slide not found", { status: 404 });
  }
}
