import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/trpc";
import { login, logout } from "~/lib/session";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("📥 Login procedure called with input:", input);
      console.log("📋 Context headers:", Object.fromEntries(ctx.headers.entries()));
      const result = await login(input.username, input.password);
      console.log("📤 Login result:", result);
      return result;
    }),

  logout: protectedProcedure.mutation(async () => {
    await logout();
    return { success: true };
  }),

  getSession: publicProcedure.query(async ({ ctx }) => {
    try {
      return {
        isLoggedIn: ctx.session?.isLoggedIn || false,
        username: ctx.session?.username || null,
        role: ctx.session?.role || null,
      };
    } catch (error) {
      console.error("getSession error:", error);
      return {
        isLoggedIn: false,
        username: null,
        role: null,
      };
    }
  }),
});
