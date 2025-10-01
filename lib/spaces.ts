import { S3Client } from "@aws-sdk/client-s3";

// Validar que las variables de entorno existan
const validateEnv = () => {
  const required = [
    "DO_SPACES_ENDPOINT",
    "DO_SPACES_REGION",
    "DO_SPACES_ACCESS_KEY_ID",
    "DO_SPACES_SECRET_ACCESS_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing Digital Ocean Spaces environment variables: ${missing.join(
        ", "
      )}`
    );
  }
};

// Crear cliente S3 para Digital Ocean Spaces
export const createSpacesClient = (): S3Client => {
  validateEnv();

  return new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT!,
    region: process.env.DO_SPACES_REGION!,
    credentials: {
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
      secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false, // Digital Ocean Spaces usa virtual-hosted-style URLs
  });
};

// Constantes de configuración
export const SPACES_CONFIG = {
  bucket: process.env.DO_SPACES_BUCKET!,
  publicUrl: process.env.DO_SPACES_PUBLIC_URL!,
  region: process.env.DO_SPACES_REGION!,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
};

/**
 * Genera una URL pública para un archivo en Digital Ocean Spaces
 * @param key - La key/path del archivo en el bucket
 * @returns URL pública del archivo
 */
export function getPublicUrl(key: string): string {
  return `${SPACES_CONFIG.publicUrl}/${key}`;
}

/**
 * Genera un nombre de archivo único con timestamp
 * @param originalName - Nombre original del archivo
 * @returns Nombre de archivo único
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "";
  const nameWithoutExt = originalName
    .split(".")
    .slice(0, -1)
    .join(".")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");

  return `${nameWithoutExt}-${timestamp}-${randomString}.${extension}`;
}

/**
 * Valida el tipo MIME de un archivo
 * @param mimeType - Tipo MIME del archivo
 * @returns true si es válido, false en caso contrario
 */
export function isValidMimeType(mimeType: string): boolean {
  return SPACES_CONFIG.allowedMimeTypes.includes(mimeType);
}

/**
 * Valida el tamaño de un archivo
 * @param size - Tamaño del archivo en bytes
 * @returns true si es válido, false en caso contrario
 */
export function isValidFileSize(size: number): boolean {
  return size <= SPACES_CONFIG.maxFileSize;
}
