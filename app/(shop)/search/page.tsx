import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import ProductCardActions from "@/components/shop/product-card-actions";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  product_images: { image_url: string; sort_order: number }[] | null;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  let items: ProductCard[] = [];

  if (query) {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, description, product_images(image_url, sort_order)")
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .order("sort_order", { ascending: true, foreignTable: "product_images" });

    items = (data ?? []) as ProductCard[];
  }

  const productIds = items.map((item) => item.id);
  let wishlistIds = new Set<string>();

  if (user && productIds.length > 0) {
    const { data: wishlistRows } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .in("product_id", productIds);
    wishlistIds = new Set((wishlistRows ?? []).map((row) => row.product_id as string));
  }

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-emerald-700">Tìm kiếm</h1>
        <form action="/search" className="flex w-full max-w-xl gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Nhập tên sản phẩm..."
            className="flex-1 rounded-full border border-emerald-100 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Tìm
          </button>
        </form>
        <p className="text-sm text-slate-600">
          {query ? `Kết quả cho "${query}"` : "Nhập từ khóa để tìm sản phẩm."}
        </p>
      </div>

      {query ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-500">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            items.map((product) => {
              const cover = product.product_images?.[0]?.image_url ?? "/legacy/product1.png";
              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
                >
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-emerald-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="mt-4 text-sm font-semibold text-emerald-700">
                      {formatter.format(Number(product.price))}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-emerald-900">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mt-2 text-sm text-slate-600">
                    {product.description ?? "Chưa có mô tả sản phẩm."}
                  </p>
                  <ProductCardActions
                    productId={product.id}
                    initialInWishlist={wishlistIds.has(product.id)}
                  />
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </main>
  );
}
