import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(/^[a-z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

export const registerSchema = z.object({
  username: usernameSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  teamName: z.string().trim().min(2, "Team name is required").max(40),
});

export const createTournamentSchema = z
  .object({
    name: z.string().trim().min(2, "Tournament name is required").max(80),
    userIds: z.array(z.string().min(1)).min(2, "Select at least 2 players"),
    legType: z.enum(["SINGLE", "DOUBLE"]).default("SINGLE"),
    groupCount: z.coerce.number().int().min(1).max(8).default(1),
    startDate: z.coerce.date().default(() => new Date()),
    knockoutFormat: z.enum(["NONE", "FINAL", "SEMI_FINAL"]).default("NONE"),
    hasThirdPlace: z.boolean().default(false),
  })
  .refine((v) => v.groupCount === 1 || v.userIds.length >= v.groupCount * 2, {
    message: "Each group needs at least 2 players — select more players or fewer groups",
    path: ["groupCount"],
  })
  .refine((v) => v.knockoutFormat !== "SEMI_FINAL" || v.userIds.length >= 4, {
    message: "Semi-finals need at least 4 players",
    path: ["knockoutFormat"],
  });

export const renameTournamentSchema = z.object({
  name: z.string().trim().min(2, "Tournament name is required").max(80),
});

export const submitResultSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
});

export const reviewResultSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const setRoleSchema = z.object({
  role: z.enum(["ADMIN", "USER"]),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
