import { z } from "zod";

// ── Profile ───────────────────────────────────────────────────────────────────

export const updateProfileSchema = z
  .object({
    displayName: z.string().min(1).max(100).nullable(),
    firstName: z.string().min(1).max(50).nullable(),
    lastName: z.string().min(1).max(50).nullable(),
    avatarUrl: z.string().url().nullable(),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9_]+$/),
  })
  .partial();

// ── Preferences ───────────────────────────────────────────────────────────────

export const updatePreferencesSchema = z
  .object({
    keywords: z.array(z.string().min(1)).max(20),
    searchLocation: z.string().min(1).max(100).nullable(),
    searchLanguage: z.string().length(2).nullable(),
    remoteOnly: z.boolean(),
    jobTypes: z.array(z.string().min(1)).max(10),
    emailNotifications: z.boolean(),
  })
  .partial();

// ── Tipos inferidos ───────────────────────────────────────────────────────────

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesData = z.infer<typeof updatePreferencesSchema>;
