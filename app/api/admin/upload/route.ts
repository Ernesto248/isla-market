import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  createSpacesClient,
  SPACES_CONFIG,
  generateUniqueFileName,
  getPublicUrl,
  isValidMimeType,
  isValidFileSize,
} from "@/lib/spaces";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${SPACES_CONFIG.allowedMimeTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validar tamaño de archivo
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${
            SPACES_CONFIG.maxFileSize / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const folder = (formData.get("folder") as string) || "products";
    const uniqueFileName = generateUniqueFileName(file.name);
    const key = `${folder}/${uniqueFileName}`;

    // Convertir el archivo a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Crear cliente de Spaces
    const spacesClient = createSpacesClient();

    // Subir archivo a Digital Ocean Spaces
    const uploadCommand = new PutObjectCommand({
      Bucket: SPACES_CONFIG.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read", // Hacer el archivo público
      Metadata: {
        originalName: file.name,
        uploadedBy: adminCheck.userId || "unknown",
        uploadedAt: new Date().toISOString(),
      },
    });

    await spacesClient.send(uploadCommand);

    // Generar URL pública
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: key,
      fileName: uniqueFileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Error uploading file to Spaces:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Endpoint para eliminar una imagen
export async function DELETE(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Obtener la key del archivo a eliminar
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "No file key provided" },
        { status: 400 }
      );
    }

    // Crear cliente de Spaces
    const spacesClient = createSpacesClient();

    // Eliminar archivo
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const deleteCommand = new DeleteObjectCommand({
      Bucket: SPACES_CONFIG.bucket,
      Key: key,
    });

    await spacesClient.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      key: key,
    });
  } catch (error) {
    console.error("Error deleting file from Spaces:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
