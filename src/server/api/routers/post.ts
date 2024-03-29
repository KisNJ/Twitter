import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import type { Post } from "@prisma/client";

const addAuthorToPosts = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((p) => p.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((u) => u.id === post.authorId);
    if (!author || author.username === null) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found",
      });
    }

    return {
      post,
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};
// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });
    return addAuthorToPosts(posts);
  }),
  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed").min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const { success } = await ratelimit.limit(authorId);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });
      return post;
    }),
  getPostsByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: {
          authorId: input.userId,
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });
      return addAuthorToPosts(posts);
    }),
  getById: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input, ctx }) => {
      const post = await ctx.prisma.post.findFirst({
        where: { id: input.postId },
      });
      if (!post)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post does not exist.",
        });
      return (await addAuthorToPosts([post]))[0];
    }),
});
