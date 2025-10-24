import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/trpc";
import { generateImagesForVocabularies } from "~/server/services/imageGeneration";

export const imageGenerationRouter = createTRPCRouter({
  stats: adminProcedure.query(async ({ ctx }) => {
    const [totalVocabularies, missingImages] = await Promise.all([
      ctx.db.vocabulary.count(),
      ctx.db.vocabulary.count({
        where: {
          OR: [{ imagePath: null }, { imagePath: "" }],
        },
      }),
    ]);

    return {
      totalVocabularies,
      missingImages,
    };
  }),

  generateMissing: adminProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.db.systemConfig.findUnique({
      where: { id: "system" },
    });

    if (!config?.zhipuApiKey) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "请先在图像生成设置中配置Zhipu API Key",
      });
    }

    const vocabularies = await ctx.db.vocabulary.findMany({
      where: {
        OR: [{ imagePath: null }, { imagePath: "" }],
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

    return await generateImagesForVocabularies(ctx.db, vocabularies, {
      apiKey: config.zhipuApiKey,
    });
  }),
});
