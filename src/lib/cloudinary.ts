
import { createHash } from "crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

function validateConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Konfigurasi Cloudinary belum lengkap. Periksa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET."
    );
  }
}

export async function uploadPdf(file: File, folder: string) {
  validateConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = "authenticated";

  // Semua parameter yang dikirim harus ikut ditandatangani.
  const params: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
    type: resourceType,
  };

  // Urutkan parameter berdasarkan nama, lalu buat signature SHA-1.
  const signatureString =
    Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&") + apiSecret!;

  const signature = createHash("sha1")
    .update(signatureString, "utf8")
    .digest("hex");

  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey!);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("type", resourceType);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error("CLOUDINARY UPLOAD ERROR:", result.error);

    throw new Error(
      result.error?.message ||
        "Gagal mengunggah PDF ke Cloudinary."
    );
  }

  return {
    publicId: result.public_id as string,
    url: result.secure_url as string,
    bytes: result.bytes as number,
  };
}
