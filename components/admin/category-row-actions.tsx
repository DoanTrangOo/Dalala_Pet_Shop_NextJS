"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { deleteCategoryAction } from "@/app/(admin)/actions";
import { Button } from "@/components/ui/button";

import { CategoryFormDialog, type CategoryRow } from "./category-form-dialog";

type CategoryRowActionsProps = {
  category: CategoryRow;
};

export function CategoryRowActions({ category }: CategoryRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.set("id", category.id);

    startTransition(async () => {
      const result = await deleteCategoryAction(formData);
      if (!result.error) {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <CategoryFormDialog
        category={category}
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
