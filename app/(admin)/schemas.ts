import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required."),
  slug: z.string().min(2, "Slug is required."),
  description: z.string().default(""),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid("Select a category."),
  name: z.string().min(2, "Product name is required."),
  slug: z.string().min(2, "Slug is required."),
  description: z.string().default(""),
  price: z.coerce.number().min(0, "Price must be at least 0."),
  stock: z.coerce.number().int().min(0, "Stock must be at least 0."),
  isActive: z.coerce.boolean().default(true),
});

export type CategoryValues = z.infer<typeof categorySchema>;
export type CategoryFormInput = z.input<typeof categorySchema>;
export type CategoryFormOutput = z.output<typeof categorySchema>;
export type ProductValues = z.infer<typeof productSchema>;
