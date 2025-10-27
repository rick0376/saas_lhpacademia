import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🆕 Faz upload de uma imagem para o Cloudinary
 *
 * @param file - Arquivo (File) para fazer upload
 * @param folder - Pasta dentro de saas_academia (ex: "alunos", "exercicios")
 * @returns URL segura da imagem no Cloudinary
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = "alunos"
): Promise<string> {
  try {
    console.log("📤 Iniciando upload para Cloudinary...");
    console.log("   Arquivo:", file.name);
    console.log("   Tamanho:", (file.size / 1024).toFixed(2), "KB");
    console.log("   Pasta:", `saas_academia/${folder}`);

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via stream
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `saas_academia/${folder}`,
            resource_type: "auto",
            transformation: [
              { width: 800, height: 800, crop: "limit" }, // Limita tamanho
              { quality: "auto:good" }, // Otimiza qualidade
            ],
          },
          (error, result) => {
            if (error) {
              console.error("❌ Erro no upload:", error);
              reject(error);
            } else if (!result) {
              console.error("❌ Upload falhou: resultado vazio");
              reject(new Error("Upload falhou"));
            } else {
              console.log("✅ Upload concluído!");
              console.log("   URL:", result.secure_url);
              resolve(result.secure_url);
            }
          }
        )
        .end(buffer);
    });
  } catch (error) {
    console.error("❌ Exceção no upload:", error);
    throw new Error("Falha no upload da imagem");
  }
}

/**
 * Extrai o public_id de uma URL do Cloudinary
 *
 * Exemplo de URL:
 * https://res.cloudinary.com/dih8izeaa/image/upload/v1234567890/saas_academia/exercicios/abc123.jpg
 *
 * Retorna: saas_academia/exercicios/abc123
 */
export function extractPublicId(url: string): string | null {
  try {
    if (!url) return null;

    // Regex para extrair o public_id
    // Remove tudo antes de /upload/ e a extensão do arquivo
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);

    if (match && match[1]) {
      const publicId = match[1];
      console.log("📋 Public ID extraído:", publicId);
      return publicId;
    }

    console.warn("⚠️ Não foi possível extrair public_id da URL:", url);
    return null;
  } catch (error) {
    console.error("❌ Erro ao extrair public_id:", error);
    return null;
  }
}

/**
 * Deleta uma imagem do Cloudinary
 *
 * @param url - URL completa da imagem no Cloudinary
 * @returns true se deletou com sucesso, false se não
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    if (!url) {
      console.warn("⚠️ URL vazia, nada para deletar");
      return false;
    }

    const publicId = extractPublicId(url);

    if (!publicId) {
      console.error("❌ Public ID não encontrado na URL:", url);
      return false;
    }

    console.log("🗑️ Deletando imagem do Cloudinary...");
    console.log("   Public ID:", publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    console.log("📊 Resultado da deleção:", result);

    if (result.result === "ok") {
      console.log("✅ Imagem deletada com sucesso do Cloudinary!");
      return true;
    } else if (result.result === "not found") {
      console.warn(
        "⚠️ Imagem não encontrada no Cloudinary (pode já ter sido deletada)"
      );
      return false;
    } else {
      console.error("❌ Erro ao deletar imagem:", result);
      return false;
    }
  } catch (error) {
    console.error("❌ Exceção ao deletar imagem do Cloudinary:", error);
    return false;
  }
}

/**
 * Deleta múltiplas imagens do Cloudinary
 *
 * @param urls - Array de URLs para deletar
 */
export async function deleteImages(urls: string[]): Promise<void> {
  console.log(`🗑️ Deletando ${urls.length} imagens do Cloudinary...`);

  const promises = urls
    .filter((url) => url && url.trim() !== "")
    .map((url) => deleteImage(url));

  const results = await Promise.allSettled(promises);

  const sucessos = results.filter(
    (r) => r.status === "fulfilled" && r.value === true
  ).length;
  const falhas = results.length - sucessos;

  console.log(`✅ Imagens deletadas: ${sucessos}`);
  if (falhas > 0) {
    console.log(`⚠️ Falhas: ${falhas}`);
  }
}

export default cloudinary;
