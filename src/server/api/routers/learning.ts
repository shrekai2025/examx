import { z } from "zod";
import { createTRPCRouter, userProcedure } from "~/server/trpc";
import { checkAndPerformSettlement } from "~/lib/settlement";

export const learningRouter = createTRPCRouter({
  // 获取用户状态
  getUserState: userProcedure.query(async ({ ctx }) => {
    // 检查并执行结算
    await checkAndPerformSettlement();
    let userState = await ctx.db.userState.findUnique({
      where: { id: "user" },
    });

    if (!userState) {
      userState = await ctx.db.userState.create({
        data: {
          id: "user",
          currentPoints: 0,
          currentReward: 0,
          sessionCorrect: 0,
          sessionWrong: 0,
          isLearning: false,
        },
      });
    }

    return userState;
  }),

  // 开始学习
  startLearning: userProcedure.mutation(async ({ ctx }) => {
    // 如果已经在学习中且有当前题目，返回当前题目
    const userState = await ctx.db.userState.findUnique({
      where: { id: "user" },
    });

    if (userState?.isLearning && userState.currentQuestionId) {
      const vocabulary = await ctx.db.vocabulary.findUnique({
        where: { id: userState.currentQuestionId },
        include: {
          exampleSentences: true,
        },
      });

      if (vocabulary) {
        // 获取所有目标词汇以生成选项
        const targetVocabularies = await ctx.db.targetVocabulary.findMany({
          include: {
            vocabulary: true,
          },
        });

        const allVocabs = targetVocabularies.map((tv: any) => tv.vocabulary);
        const wrongOptions = allVocabs
          .filter((v: any) => v.id !== vocabulary.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        const options = [...wrongOptions, vocabulary].sort(() => Math.random() - 0.5);

        // 如果是sentence-to-word类型，生成例句数据
        let sentenceData = null;
        if (userState.currentQuestionType === "sentence-to-word" && vocabulary.exampleSentences) {
          const validSentences = vocabulary.exampleSentences.filter(
            (s: any) => s.audioPath
          );
          if (validSentences.length > 0) {
            const randomSentence = validSentences[
              Math.floor(Math.random() * validSentences.length)
            ];

            const sentenceWithBlank = randomSentence.sentence.replace(
              new RegExp(`\\b${vocabulary.word}\\b`, 'gi'),
              '______'
            );

            sentenceData = {
              sentenceId: randomSentence.id,
              originalSentence: randomSentence.sentence,
              sentenceWithBlank,
              audioPath: randomSentence.audioPath,
            };
          }
        }

        return {
          continuing: true,
          question: vocabulary,
          questionType: userState.currentQuestionType as "image-to-word" | "word-to-image" | "sentence-to-word",
          sessionCorrect: userState.sessionCorrect,
          sessionWrong: userState.sessionWrong,
          options,
          sentenceData,
        };
      }
    }

    // 否则，开始新的学习会话
    await ctx.db.userState.update({
      where: { id: "user" },
      data: {
        isLearning: true,
        sessionCorrect: 0,
        sessionWrong: 0,
      },
    });

    // 获取下一个题目
    return await getNextQuestion(ctx);
  }),

  // 停止学习
  stopLearning: userProcedure.mutation(async ({ ctx }) => {
    await ctx.db.userState.update({
      where: { id: "user" },
      data: {
        isLearning: false,
      },
    });

    return { success: true };
  }),

  // 提交答案
  submitAnswer: userProcedure
    .input(
      z.object({
        questionId: z.string(),
        answer: z.string(),
        questionType: z.enum(["image-to-word", "word-to-image", "sentence-to-word"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 获取配置
      const config = await ctx.db.systemConfig.findUnique({
        where: { id: "system" },
      });

      if (!config) {
        throw new Error("System not configured");
      }

      // 获取题目
      const vocabulary = await ctx.db.vocabulary.findUnique({
        where: { id: input.questionId },
      });

      if (!vocabulary) {
        throw new Error("Question not found");
      }

      // 判断答案是否正确
      const isCorrect = input.answer === vocabulary.word;
      const pointChange = isCorrect ? config.pointsPerQuestion : -config.pointsPerQuestion;

      // 获取当前用户状态
      const userState = await ctx.db.userState.findUnique({
        where: { id: "user" },
      });

      if (!userState) {
        throw new Error("User state not found");
      }

      const newPoints = userState.currentPoints + pointChange;

      // 计算新的奖励金
      let newReward = Math.max(0, newPoints * config.pointsToRewardRatio);
      newReward = Math.min(newReward, config.maxRewardPerCycle);

      // 更新用户状态
      await ctx.db.userState.update({
        where: { id: "user" },
        data: {
          currentPoints: newPoints,
          currentReward: newReward,
          sessionCorrect: isCorrect ? userState.sessionCorrect + 1 : userState.sessionCorrect,
          sessionWrong: isCorrect ? userState.sessionWrong : userState.sessionWrong + 1,
        },
      });

      // 记录积分变动
      await ctx.db.pointLog.create({
        data: {
          changeAmount: pointChange,
          balanceAfter: newPoints,
          questionWord: isCorrect ? undefined : vocabulary.word,
          questionType: isCorrect ? undefined : input.questionType,
          correctAnswer: isCorrect ? undefined : vocabulary.word,
        },
      });

      // 获取下一个题目
      const nextQuestion = await getNextQuestion(ctx);

      return {
        isCorrect,
        correctAnswer: vocabulary.word,
        pointChange,
        newPoints,
        newReward,
        sessionCorrect: isCorrect ? userState.sessionCorrect + 1 : userState.sessionCorrect,
        sessionWrong: isCorrect ? userState.sessionWrong : userState.sessionWrong + 1,
        nextQuestion,
      };
    }),

  // 获取积分变动日志
  getPointLogs: userProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.pointLog.findMany({
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
});

// 辅助函数：获取下一个题目
async function getNextQuestion(ctx: any) {
  // 获取所有目标词汇
  const targetVocabularies = await ctx.db.targetVocabulary.findMany({
    include: {
      vocabulary: {
        include: {
          exampleSentences: true,
        },
      },
    },
  });

  if (targetVocabularies.length === 0) {
    throw new Error("No target vocabularies available");
  }

  // 随机选择一个词汇
  const randomIndex = Math.floor(Math.random() * targetVocabularies.length);
  const selectedVocab = targetVocabularies[randomIndex]!.vocabulary;

  // 随机选择题目类型（三种类型：image-to-word, word-to-image, sentence-to-word）
  const questionTypes: ("image-to-word" | "word-to-image" | "sentence-to-word")[] =
    ["image-to-word", "word-to-image", "sentence-to-word"];

  // 如果该词汇没有例句或例句没有音频，则不能选择sentence-to-word类型
  const hasValidSentence = selectedVocab.exampleSentences?.some(
    (s: any) => s.audioPath
  );

  const availableTypes = hasValidSentence
    ? questionTypes
    : questionTypes.filter(t => t !== "sentence-to-word");

  const questionType = availableTypes[
    Math.floor(Math.random() * availableTypes.length)
  ]!;

  // 获取3个选项（包括正确答案）
  const allVocabs = targetVocabularies.map((tv: any) => tv.vocabulary);
  const wrongOptions = allVocabs
    .filter((v: any) => v.id !== selectedVocab.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const options = [...wrongOptions, selectedVocab].sort(() => Math.random() - 0.5);

  // 如果是sentence-to-word类型，随机选择一个有音频的例句
  let sentenceData = null;
  if (questionType === "sentence-to-word" && selectedVocab.exampleSentences) {
    const validSentences = selectedVocab.exampleSentences.filter(
      (s: any) => s.audioPath
    );
    if (validSentences.length > 0) {
      const randomSentence = validSentences[
        Math.floor(Math.random() * validSentences.length)
      ];

      // 将句子中的目标词替换为下划线
      const sentenceWithBlank = randomSentence.sentence.replace(
        new RegExp(`\\b${selectedVocab.word}\\b`, 'gi'),
        '______'
      );

      sentenceData = {
        sentenceId: randomSentence.id,
        originalSentence: randomSentence.sentence,
        sentenceWithBlank,
        audioPath: randomSentence.audioPath,
      };
    }
  }

  // 更新用户状态
  await ctx.db.userState.update({
    where: { id: "user" },
    data: {
      currentQuestionId: selectedVocab.id,
      currentQuestionType: questionType,
    },
  });

  return {
    continuing: false,
    question: selectedVocab,
    questionType,
    options,
    sentenceData,
  };
}
