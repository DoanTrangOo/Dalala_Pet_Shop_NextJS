"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { deleteProductAction } from "@/app/(admin)/actions";
import { Button } from "@/components/ui/button";

import { ProductEditorData, ProductFormDialog, ProductCategory } from "./product-form-dialog";

type ProductRowActionsProps = {
  product: ProductEditorData;
  categories: ProductCategory[];
};

export function ProductRowActions({ product, categories }: ProductRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.set("id", product.id);

    startTransition(async () => {
      const result = await deleteProductAction(formData);
      if (!result.error) {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <ProductFormDialog
        categories={categories}
        product={product}
        trigger={
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
