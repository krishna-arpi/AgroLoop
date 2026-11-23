import { z } from "zod";

export const UserRoleSchema = z.enum([
  "FARMER",
  "HUB_OPERATOR",
  "INDUSTRIAL_BUYER",
  "ADMIN",
  "PUBLIC",
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const ProvenanceSchema = z.enum([
  "PROPOSAL_REPORTED",
  "LITERATURE",
  "MODELLED",
  "MEASURED",
]);
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
