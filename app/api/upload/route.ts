import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  createSpacesClient,
  SPACES_CONFIG,
  generateUniqueFileName,
  isValidMimeType,
  isValidFileSize,
  getPublicUrl,
} from "@/lib/spaces";

export const dynamic = "force-dynamic";

// Configuración para permitir archivos grandes
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo MIME
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        {
          error:
            "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF)",
        },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          error: `Archivo demasiado grande. Tamaño máximo: ${
            SPACES_CONFIG.maxFileSize / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      );
    }

    // Generar nombre único
    const uniqueFileName = generateUniqueFileName(file.name);
    const key = `${folder}/${uniqueFileName}`;

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Digital Ocean Spaces
    const spacesClient = createSpacesClient();
    const uploadCommand = new PutObjectCommand({
      Bucket: SPACES_CONFIG.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read", // Hacer el archivo público
    });

    await spacesClient.send(uploadCommand);

    // Generar URL pública
    const url = getPublicUrl(key);

    return NextResponse.json(
      {
        url,
        key,
        size: file.size,
        type: file.type,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 }
    );
  }
}

// DELETE endpoint para eliminar archivos
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "No se proporcionó la key del archivo" },
        { status: 400 }
      );
    }

    // Eliminar de Digital Ocean Spaces
    const spacesClient = createSpacesClient();
    const deleteCommand = new DeleteObjectCommand({
      Bucket: SPACES_CONFIG.bucket,
      Key: key,
    });

    await spacesClient.send(deleteCommand);

    return NextResponse.json(
      { message: "Archivo eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Error al eliminar el archivo" },
      { status: 500 }
    );
  }
}
