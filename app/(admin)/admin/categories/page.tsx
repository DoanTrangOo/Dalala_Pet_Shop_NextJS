import { createClient } from "@/lib/supabase/server";

import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { CategoriesTable } from "@/components/admin/categories-table";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name");

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage product groupings for the storefront.
          </p>
        </div>
        <CategoryFormDialog />
      </div>

      <CategoriesTable categories={(categories ?? []) as { id: string; name: string; slug: string; description: string | null }[]} />
    </main>
  );
}
