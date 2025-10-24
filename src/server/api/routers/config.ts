import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/trpc";

const DEFAULT_CONFIG = {
  id: "system",
  pointsPerQuestion: 1,
  pointsToRewardRatio: 1.0,
  maxRewardPerCycle: 100.0,
  settlementDay: null as number | null,
  settlementInitialized: false,
  zhipuApiKey: null as string | null,
  elevenlabsApiKey: null as string | null,
};

export const configRouter = createTRPCRouter({
  // 获取系统配置
  get: adminProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.systemConfig.upsert({
      where: { id: "system" },
      create: DEFAULT_CONFIG,
      update: {},
    });

    return config;
  }),

  // 更新配置（不包括结算日期）
  update: adminProcedure
    .input(
      z.object({
        pointsPerQuestion: z.number().int().positive().optional(),
        pointsToRewardRatio: z.number().positive().optional(),
        maxRewardPerCycle: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.systemConfig.upsert({
        where: { id: "system" },
        create: {
          ...DEFAULT_CONFIG,
          ...input,
        },
        update: input,
      });
    }),

  // 初始化结算周期（只能执行一次）
  initializeSettlement: adminProcedure
    .input(
      z.object({
        settlementDay: z.number().int().min(1).max(31),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const config = await ctx.db.systemConfig.upsert({
        where: { id: "system" },
        create: DEFAULT_CONFIG,
        update: {},
      });

      if (config.settlementInitialized) {
        throw new Error("Settlement cycle already initialized");
      }

      return await ctx.db.systemConfig.update({
        where: { id: "system" },
        data: {
          settlementDay: input.settlementDay,
          settlementInitialized: true,
        },
      });
    }),

  // 获取图像生成配置
  getImageSettings: adminProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.systemConfig.upsert({
      where: { id: "system" },
      create: DEFAULT_CONFIG,
      select: {
        zhipuApiKey: true,
      },
      update: {},
    });

    const apiKey = config?.zhipuApiKey?.trim();

    return {
      hasApiKey: Boolean(apiKey),
      maskedApiKey: apiKey ? maskApiKey(apiKey) : null,
    };
  }),

  // 更新图像生成配置
  updateImageSettings: adminProcedure
    .input(
      z.object({
        apiKey: z.string().trim().min(1, "API Key不能为空").optional(),
        clear: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { apiKey, clear } = input;
      const nextApiKey = clear ? null : apiKey ?? null;

      await ctx.db.systemConfig.upsert({
        where: { id: "system" },
        create: {
          ...DEFAULT_CONFIG,
          zhipuApiKey: nextApiKey,
        },
        update: {
          zhipuApiKey: nextApiKey,
        },
      });

      return {
        success: true,
        hasApiKey: Boolean(nextApiKey),
        maskedApiKey: nextApiKey ? maskApiKey(nextApiKey) : null,
      };
    }),

  // 获取音频生成配置
  getAudioSettings: adminProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.systemConfig.upsert({
      where: { id: "system" },
      create: DEFAULT_CONFIG,
      select: {
        elevenlabsApiKey: true,
      },
      update: {},
    });

    const apiKey = config?.elevenlabsApiKey?.trim();

    return {
      hasApiKey: Boolean(apiKey),
      maskedApiKey: apiKey ? maskApiKey(apiKey) : null,
    };
  }),

  // 更新音频生成配置
  updateAudioSettings: adminProcedure
    .input(
      z.object({
        apiKey: z.string().trim().min(1, "API Key不能为空").optional(),
        clear: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { apiKey, clear } = input;
      const nextApiKey = clear ? null : apiKey ?? null;

      await ctx.db.systemConfig.upsert({
        where: { id: "system" },
        create: {
          ...DEFAULT_CONFIG,
          elevenlabsApiKey: nextApiKey,
        },
        update: {
          elevenlabsApiKey: nextApiKey,
        },
      });

      return {
        success: true,
        hasApiKey: Boolean(nextApiKey),
        maskedApiKey: nextApiKey ? maskApiKey(nextApiKey) : null,
      };
    }),
});

function maskApiKey(apiKey: string) {
  if (apiKey.length <= 8) {
    return "*".repeat(apiKey.length);
  }
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`;
}
