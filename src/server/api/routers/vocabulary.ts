import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/trpc";

export const vocabularyRouter = createTRPCRouter({
  // 获取所有词汇
  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.vocabulary.findMany({
      include: {
        exampleSentences: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 获取单个词汇
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.vocabulary.findUnique({
        where: { id: input.id },
        include: {
          exampleSentences: true,
        },
      });
    }),

  // 创建词汇
  create: adminProcedure
    .input(
      z.object({
        word: z.string().min(1),
        imagePath: z.string().optional(),
        audioPath: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.vocabulary.create({
        data: input,
      });
    }),

  // 批量创建词汇
  createBatch: adminProcedure
    .input(
      z.object({
        words: z.array(z.string().min(1)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = {
        created: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const word of input.words) {
        try {
          // 检查是否已存在
          const existing = await ctx.db.vocabulary.findUnique({
            where: { word: word.trim() },
          });

          if (existing) {
            results.skipped++;
            continue;
          }

          // 创建新词汇
          await ctx.db.vocabulary.create({
            data: { word: word.trim() },
          });
          results.created++;
        } catch (error) {
          results.errors.push(`Failed to create "${word}": ${error}`);
        }
      }

      return results;
    }),

  // 更新词汇
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        word: z.string().min(1).optional(),
        imagePath: z.string().optional().nullable(),
        audioPath: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.vocabulary.update({
        where: { id },
        data,
      });
    }),

  // 删除词汇
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.vocabulary.delete({
        where: { id: input.id },
      });
    }),

  // 获取所有目标词汇（包含完整词汇信息）
  getTargetVocabularies: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.targetVocabulary.findMany({
      include: {
        vocabulary: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 添加目标词汇
  addToTarget: adminProcedure
    .input(z.object({ vocabularyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 检查是否已存在
      const existing = await ctx.db.targetVocabulary.findFirst({
        where: { vocabularyId: input.vocabularyId },
      });

      if (existing) {
        throw new Error("This vocabulary is already in target list");
      }

      return await ctx.db.targetVocabulary.create({
        data: { vocabularyId: input.vocabularyId },
      });
    }),

  // 从目标词汇中移除
  removeFromTarget: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.targetVocabulary.delete({
        where: { id: input.id },
      });
    }),
});
