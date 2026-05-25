import { createClient } from "@/lib/supabase/server";

import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { ProductsTable } from "@/components/admin/products-table";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, category_id, name, slug, description, price, stock, is_active, categories(id, name, slug), product_images(image_url, sort_order)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  const normalizedProducts = (products ?? []).map((product) => ({
    ...product,
    categories: Array.isArray(product.categories)
      ? product.categories[0] ?? null
      : product.categories,
  }));

  const normalizedCategories = categories ?? [];

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage catalog items, pricing, stock, and uploaded images.
          </p>
        </div>
        <ProductFormDialog categories={normalizedCategories} />
      </div>

      <ProductsTable products={normalizedProducts} categories={normalizedCategories} />
    </main>
  );
}
