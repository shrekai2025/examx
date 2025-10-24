import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { PrismaClient, Vocabulary } from "@prisma/client";

const ZHIPU_IMAGE_ENDPOINT =
  "https://open.bigmodel.cn/api/paas/v4/images/generations";
const DEFAULT_MODEL = "cogview-3-flash";
const DEFAULT_CONCURRENCY = 3;
const GENERATED_SUBDIR = "generated";

interface GenerationOptions {
  apiKey: string;
  concurrency?: number;
  model?: string;
}

interface GenerationResult {
  vocabularyId: string;
  word: string;
  success: boolean;
  imagePath?: string;
  error?: string;
}

type VocabularyTask = Pick<Vocabulary, "id" | "word">;

export async function generateImagesForVocabularies(
  db: PrismaClient,
  vocabularies: VocabularyTask[],
  options: GenerationOptions
) {
  const { apiKey, concurrency = DEFAULT_CONCURRENCY, model = DEFAULT_MODEL } =
    options;

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    GENERATED_SUBDIR
  );
  await mkdir(uploadDir, { recursive: true });

  const results: GenerationResult[] = [];
  let currentIndex = 0;

  const worker = async () => {
    while (true) {
      const index = currentIndex++;
      if (index >= vocabularies.length) break;

      const vocab = vocabularies[index];

      try {
        const imageUrl = await requestZhipuImage({
          apiKey,
          prompt: vocab.word,
          model,
        });

        const savedPath = await downloadAndPersistImage({
          imageUrl,
          uploadDir,
          vocabularyId: vocab.id,
        });

        await db.vocabulary.update({
          where: { id: vocab.id },
          data: { imagePath: savedPath },
        });

        results.push({
          vocabularyId: vocab.id,
          word: vocab.word,
          success: true,
          imagePath: savedPath,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";

        results.push({
          vocabularyId: vocab.id,
          word: vocab.word,
          success: false,
          error: message,
        });
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, vocabularies.length) },
    () => worker()
  );

  await Promise.all(workers);

  return {
    total: vocabularies.length,
    generated: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

async function requestZhipuImage(options: {
  apiKey: string;
  prompt: string;
  model: string;
}) {
  const response = await fetch(ZHIPU_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      prompt: options.prompt,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      (payload && (payload.error?.message || payload.message)) ||
      response.statusText ||
      "Failed to generate image";

    throw new Error(
      `Image generation failed for "${options.prompt}": ${errorMessage}`
    );
  }

  const url = payload?.data?.[0]?.url;
  if (!url || typeof url !== "string") {
    throw new Error(
      `Image generation succeeded but no image URL returned for "${options.prompt}"`
    );
  }

  return url;
}

async function downloadAndPersistImage(options: {
  imageUrl: string;
  uploadDir: string;
  vocabularyId: string;
}) {
  const response = await fetch(options.imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download generated image (status ${response.status})`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const contentType = response.headers.get("content-type");
  const extension = deriveExtension(contentType, options.imageUrl);

  const filename = `${options.vocabularyId}-${crypto.randomUUID()}${extension}`;
  const filepath = path.join(options.uploadDir, filename);
  await writeFile(filepath, buffer);

  const publicPath = path
    .join("/uploads", GENERATED_SUBDIR, filename)
    .replace(/\\/g, "/");

  return publicPath;
}

function deriveExtension(contentType: string | null, imageUrl: string) {
  if (contentType) {
    if (contentType.includes("png")) return ".png";
    if (contentType.includes("jpeg") || contentType.includes("jpg"))
      return ".jpg";
    if (contentType.includes("webp")) return ".webp";
    if (contentType.includes("gif")) return ".gif";
  }

  const urlExtension = path.extname(new URL(imageUrl).pathname);
  if (urlExtension) return urlExtension;

  return ".png";
}
