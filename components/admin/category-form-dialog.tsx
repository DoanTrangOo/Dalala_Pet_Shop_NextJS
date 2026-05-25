"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { createCategoryAction, updateCategoryAction } from "@/app/(admin)/actions";
import { categorySchema, type CategoryValues } from "@/app/(admin)/schemas";
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
import { Textarea } from "@/components/ui/textarea";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type CategoryFormDialogProps = {
  category?: CategoryRow;
  trigger?: ReactNode;
};

export function CategoryFormDialog({ category, trigger }: CategoryFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const defaultValues = useMemo<CategoryValues>(
    () => ({
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
    }),
    [category]
  );

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = (values: CategoryValues) => {
    setMessage(null);

    const formData = new FormData();
    if (category?.id) formData.set("id", category.id);
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    formData.set("description", values.description ?? "");

    startTransition(async () => {
      const result = category
        ? await updateCategoryAction(formData)
        : await createCategoryAction(formData);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result.success ?? "Saved.");
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
            Add category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>Organize the catalog with clear category labels.</DialogDescription>
        </DialogHeader>

        {message ? (
          <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {message}
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dog care" disabled={isPending} />
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
                    <Input {...field} placeholder="dog-care" disabled={isPending} />
                  </FormControl>
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
                    <Textarea {...field} rows={3} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : category ? "Update category" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
