"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { PlusCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { saveProductAction } from "@/app/(admin)/actions";
import { productSchema } from "@/app/(admin)/schemas";

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormOutput = z.output<typeof productSchema>;

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

export type ProductEditorData = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
};

type ProductFormDialogProps = {
  categories: ProductCategory[];
  product?: ProductEditorData;
  trigger?: ReactNode;
};

export function ProductFormDialog({ categories, product, trigger }: ProductFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const defaultValues = useMemo<ProductFormInput>(
    () => ({
      id: product?.id,
      categoryId: product?.category_id ?? categories[0]?.id ?? "",
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      isActive: product?.is_active ?? true,
    }),
    [categories, product]
  );

  const form = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues as ProductFormInput,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = (values: ProductFormOutput) => {
    setMessage(null);

    const formData = new FormData();
    if (values.id) formData.set("id", values.id);
    formData.set("categoryId", values.categoryId);
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    formData.set("description", values.description ?? "");
    formData.set("price", String(values.price));
    formData.set("stock", String(values.stock));
    formData.set("isActive", String(values.isActive));

    const fileInput = (document.getElementById(
      product ? `product-images-${product.id}` : "product-images-new"
    ) as HTMLInputElement | null)?.files;

    Array.from(fileInput ?? []).forEach((file) => formData.append("images", file));

    startTransition(async () => {
      const result = await saveProductAction(formData);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result.success ?? "Saved.");
      form.reset(defaultValues);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Manage catalog data, pricing, stock, and image uploads.
          </DialogDescription>
        </DialogHeader>

        {message ? (
          <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {message}
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dog Food Premium" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="dog-food-premium" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Short product description" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value as string | number | undefined}
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value as string | number | undefined}
                        type="number"
                        min="0"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(value === "true")} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor={product ? `product-images-${product.id}` : "product-images-new"}>
                Images
              </FormLabel>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <Input
                  id={product ? `product-images-${product.id}` : "product-images-new"}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isPending}
                  className="border-0 p-0 shadow-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : product ? "Update product" : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
