import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/trpc";
import {
  generateAudioForVocabularies,
  generateAudioForSentences,
} from "~/server/services/audioGeneration";

export const audioGenerationRouter = createTRPCRouter({
  stats: adminProcedure.query(async ({ ctx }) => {
    const [totalVocabularies, missingAudio, totalSentences, missingSentenceAudio] =
      await Promise.all([
        ctx.db.vocabulary.count(),
        ctx.db.vocabulary.count({
          where: {
            OR: [{ audioPath: null }, { audioPath: "" }],
          },
        }),
        ctx.db.exampleSentence.count(),
        ctx.db.exampleSentence.count({
          where: {
            OR: [{ audioPath: null }, { audioPath: "" }],
          },
        }),
      ]);

    return {
      totalVocabularies,
      missingAudio,
      totalSentences,
      missingSentenceAudio,
    };
  }),

  generateMissing: adminProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.db.systemConfig.findUnique({
      where: { id: "system" },
    });

    if (!config?.elevenlabsApiKey) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "请先在音频生成设置中配置ElevenLabs API Key",
      });
    }

    const vocabularies = await ctx.db.vocabulary.findMany({
      where: {
        OR: [{ audioPath: null }, { audioPath: "" }],
      },
      select: {
        id: true,
        word: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (vocabularies.length === 0) {
      return {
        total: 0,
        generated: 0,
        failed: 0,
        results: [],
      };
    }

    return await generateAudioForVocabularies(ctx.db, vocabularies, {
      apiKey: config.elevenlabsApiKey,
    });
  }),

  generateSentenceAudio: adminProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.db.systemConfig.findUnique({
      where: { id: "system" },
    });

    if (!config?.elevenlabsApiKey) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "请先在音频生成设置中配置ElevenLabs API Key",
      });
    }

    const sentences = await ctx.db.exampleSentence.findMany({
      where: {
        OR: [{ audioPath: null }, { audioPath: "" }],
      },
      select: {
        id: true,
        sentence: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (sentences.length === 0) {
      return {
        total: 0,
        generated: 0,
        failed: 0,
        results: [],
      };
    }

    return await generateAudioForSentences(ctx.db, sentences, {
      apiKey: config.elevenlabsApiKey,
    });
  }),
});
