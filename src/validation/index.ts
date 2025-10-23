import { z } from "zod";

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  firstName: z.string().min(1, { message: "First Name is required" }),
  lastName: z.string().min(1, { message: "Last Name is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export const registerWithInviteSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First Name is required" })
    .optional(),
  lastName: z.string().min(1, { message: "Last Name is required" }).optional(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .optional(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const inviteSchema = z.object({
  email: z.email("Invalid email address"),
  teamId: z.string().min(1, "Team is required"),
  teamRoleId: z.string().min(1, "Role is required"),
  orgRoleId: z.string().optional(),
});

const urlRegex =
  /^(?:https?:\/\/)?([a-zA-Z0-9.-]+|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-fA-F:]+\])(:\d{1,5})?$/;

export const monitorSchema = z.object({
  type: z.string().min(1, "You must select an option"),
  url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
  name: z.string().min(1, "Display name is required"),
  n: z
    .number({ message: "Number required" })
    .min(1, "Minimum value is 1")
    .max(25, "Maximum value is 25"),
  notificationChannels: z.array(z.string()).optional().default([]),
  secret: z.string().optional(),
  interval: z.number().min(5000, "Interval must be at least 5000 milliseconds"),
});

export const monitorPatchSchema = monitorSchema
  .omit({
    type: true,
    url: true,
  })
  .partial();

export const monitorIdChecksQuerySchema = z.object({
  page: z.string().transform((val, ctx) => {
    const num = Number(val);
    if (Number.isNaN(num)) {
      ctx.addIssue({
        code: "custom",
        message: "page must be a number",
      });
      return z.NEVER;
    }
    if (num < 0) {
      ctx.addIssue({
        code: "custom",
        message: "page must greater than 0",
      });
      return z.NEVER;
    }
    return num;
  }),
  rowsPerPage: z.string().transform((val, ctx) => {
    const num = Number(val);
    if (Number.isNaN(num)) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be a number",
      });
      return z.NEVER;
    }
    if (num < 0) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be greater than 0",
      });
      return z.NEVER;
    }
    if (num > 100) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be less than or equal to 100",
      });
      return z.NEVER;
    }
    return num;
  }),
});

export const monitorIdQuerySchema = z.object({
  embedChecks: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  range: z.string().optional(),
  status: z.string().optional(),
});
