import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { PrismaClient, Vocabulary, ExampleSentence } from "@prisma/client";

const ELEVENLABS_TTS_ENDPOINT =
  "https://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_MODEL_ID = "eleven_flash_v2_5";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";
const DEFAULT_VOICE_ID = "qBDvhofpxp92JgXJxDjB";
const DEFAULT_CONCURRENCY = 3;
const GENERATED_AUDIO_SUBDIR = "audio/generated";

interface GenerationOptions {
  apiKey: string;
  concurrency?: number;
  modelId?: string;
  voiceId?: string;
  outputFormat?: string;
}

interface GenerationResult {
  vocabularyId: string;
  word: string;
  success: boolean;
  audioPath?: string;
  error?: string;
}

type VocabularyTask = Pick<Vocabulary, "id" | "word">;

export async function generateAudioForVocabularies(
  db: PrismaClient,
  vocabularies: VocabularyTask[],
  options: GenerationOptions
) {
  const {
    apiKey,
    concurrency = DEFAULT_CONCURRENCY,
    modelId = DEFAULT_MODEL_ID,
    voiceId = DEFAULT_VOICE_ID,
    outputFormat = DEFAULT_OUTPUT_FORMAT,
  } = options;

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    GENERATED_AUDIO_SUBDIR
  );
  await mkdir(uploadDir, { recursive: true });

  const results: GenerationResult[] = [];
  let activeIndex = 0;

  const worker = async () => {
    while (true) {
      const index = activeIndex++;
      if (index >= vocabularies.length) break;

      const vocab = vocabularies[index];

      try {
        const audioBuffer = await requestElevenLabsAudio({
          apiKey,
          text: vocab.word,
          modelId,
          voiceId,
          outputFormat,
        });

        const savedPath = await persistAudioToDisk({
          audioBuffer,
          uploadDir,
          vocabularyId: vocab.id,
          outputFormat,
        });

        await db.vocabulary.update({
          where: { id: vocab.id },
          data: { audioPath: savedPath },
        });

        results.push({
          vocabularyId: vocab.id,
          word: vocab.word,
          success: true,
          audioPath: savedPath,
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

async function requestElevenLabsAudio(options: {
  apiKey: string;
  text: string;
  modelId: string;
  voiceId: string;
  outputFormat: string;
}) {
  const response = await fetch(
    `${ELEVENLABS_TTS_ENDPOINT}/${options.voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": options.apiKey,
      },
      body: JSON.stringify({
        text: options.text,
        model_id: options.modelId,
        output_format: options.outputFormat,
      }),
    }
  );

  if (!response.ok) {
    let message = `Audio generation failed for "${options.text}" (status ${response.status})`;
    try {
      const payload = await response.json();
      const detail =
        payload?.detail ||
        payload?.message ||
        payload?.error ||
        payload?.error?.message;
      if (detail) {
        message = `${message}: ${detail}`;
      }
    } catch {
      // ignore JSON parse errors when response is binary
    }
    throw new Error(message);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function persistAudioToDisk(options: {
  audioBuffer: Buffer;
  uploadDir: string;
  vocabularyId: string;
  outputFormat: string;
}) {
  const extension = resolveExtension(options.outputFormat);
  const filename = `${options.vocabularyId}-${crypto.randomUUID()}${extension}`;
  const filepath = path.join(options.uploadDir, filename);
  await writeFile(filepath, options.audioBuffer);

  const publicPath = path
    .join("/uploads", GENERATED_AUDIO_SUBDIR, filename)
    .replace(/\\/g, "/");

  return publicPath;
}

function resolveExtension(outputFormat: string) {
  if (outputFormat.startsWith("mp3")) return ".mp3";
  if (outputFormat.startsWith("pcm")) return ".wav";
  if (outputFormat.startsWith("mu-law")) return ".mulaw";
  if (outputFormat.startsWith("ulaw")) return ".ulaw";
  if (outputFormat.startsWith("opus")) return ".opus";
  return ".mp3";
}

type SentenceTask = Pick<ExampleSentence, "id" | "sentence">;

export async function generateAudioForSentences(
  db: PrismaClient,
  sentences: SentenceTask[],
  options: GenerationOptions
) {
  const {
    apiKey,
    concurrency = DEFAULT_CONCURRENCY,
    modelId = DEFAULT_MODEL_ID,
    voiceId = DEFAULT_VOICE_ID,
    outputFormat = DEFAULT_OUTPUT_FORMAT,
  } = options;

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    GENERATED_AUDIO_SUBDIR
  );
  await mkdir(uploadDir, { recursive: true });

  const results: Array<{
    sentenceId: string;
    sentence: string;
    success: boolean;
    audioPath?: string;
    error?: string;
  }> = [];
  let activeIndex = 0;

  const worker = async () => {
    while (true) {
      const index = activeIndex++;
      if (index >= sentences.length) break;

      const sentence = sentences[index];

      try {
        const audioBuffer = await requestElevenLabsAudio({
          apiKey,
          text: sentence.sentence,
          modelId,
          voiceId,
          outputFormat,
        });

        const savedPath = await persistAudioToDisk({
          audioBuffer,
          uploadDir,
          vocabularyId: sentence.id,
          outputFormat,
        });

        await db.exampleSentence.update({
          where: { id: sentence.id },
          data: { audioPath: savedPath },
        });

        results.push({
          sentenceId: sentence.id,
          sentence: sentence.sentence,
          success: true,
          audioPath: savedPath,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";

        results.push({
          sentenceId: sentence.id,
          sentence: sentence.sentence,
          success: false,
          error: message,
        });
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, sentences.length) },
    () => worker()
  );

  await Promise.all(workers);

  return {
    total: sentences.length,
    generated: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
