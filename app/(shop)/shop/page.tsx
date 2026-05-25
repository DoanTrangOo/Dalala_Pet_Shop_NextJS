import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type ShopPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  product_images: { image_url: string; sort_order: number }[] | null;
  category: { name: string; slug: string } | null;
};

type CategoryCard = {
  id: string;
  name: string;
  slug: string;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeCategorySlug =
    typeof resolvedSearchParams?.category === "string" ? resolvedSearchParams.category : "";
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const selectedCategory = activeCategorySlug
    ? categories?.find((category) => category.slug === activeCategorySlug) ?? null
    : null;

  let productsQuery = supabase
    .from("products")
    .select("id, name, slug, price, product_images(image_url, sort_order), category:categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("sort_order", { ascending: true, foreignTable: "product_images" });

  if (selectedCategory) {
    productsQuery = productsQuery.eq("category_id", selectedCategory.id);
  }

  const { data: products } = await productsQuery;

  const items = (products ?? []) as ProductCard[];
  const categoryItems = (categories ?? []) as CategoryCard[];
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold text-emerald-700">Cửa hàng</h1>
        <p className="text-base text-slate-600">
          {selectedCategory
            ? `Đang lọc theo nhóm: ${selectedCategory.name}`
            : "Sản phẩm mới nhất tại Dalala Pet Store."}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href="/shop"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${!activeCategorySlug ? "bg-emerald-600 text-white" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
          >
            Tất cả
          </Link>
          {categoryItems.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategorySlug === category.slug ? "bg-emerald-600 text-white" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-500">
            Hiện tại chưa có sản phẩm.
          </div>
        ) : (
          items.map((product) => {
            const cover = product.product_images?.[0]?.image_url ?? "/legacy/product1.png";

            return (
              <div
                key={product.id}
                className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="flex items-center justify-between text-sm text-emerald-700">
                      <span className="font-semibold">{formatter.format(Number(product.price))}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs">New</span>
                    </div>
                    <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-emerald-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-800">
                      {product.name}
                    </h3>
                  </Link>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    href={`/product/${product.slug}`}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Xem chi tiết
                  </Link>
                    <Link
                      href="/contact"
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Liên hệ shop
                    </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
