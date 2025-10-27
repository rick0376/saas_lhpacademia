import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Faz upload de um arquivo para o Cloudinary
 * @param file - Arquivo (Buffer ou base64)
 * @param folder - Pasta no Cloudinary (ex: saas_academia/exercicios)
 * @returns URL da imagem no Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      },
      (error, result) => {
        if (error) {
          console.error("❌ Erro ao fazer upload para Cloudinary:", error);
          reject(error);
        } else if (result) {
          console.log(
            "✅ Upload para Cloudinary concluído:",
            result.secure_url
          );
          resolve(result.secure_url);
        } else {
          reject(new Error("Resultado do upload é undefined"));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}
