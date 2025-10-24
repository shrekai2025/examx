import { createCallerFactory, createTRPCRouter } from "~/server/trpc";
import { authRouter } from "./routers/auth";
import { vocabularyRouter } from "./routers/vocabulary";
import { configRouter } from "./routers/config";
import { learningRouter } from "./routers/learning";
import { imageGenerationRouter } from "./routers/imageGeneration";
import { audioGenerationRouter } from "./routers/audioGeneration";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  vocabulary: vocabularyRouter,
  config: configRouter,
  learning: learningRouter,
  imageGeneration: imageGenerationRouter,
  audioGeneration: audioGenerationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
