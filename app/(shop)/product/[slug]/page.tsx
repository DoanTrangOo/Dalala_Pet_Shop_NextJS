import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  stock: number;
  product_images: { image_url: string; sort_order: number }[] | null;
  category: { name: string; slug: string } | null;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, description, stock, product_images(image_url, sort_order), category:categories(name, slug)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .order("sort_order", { ascending: true, foreignTable: "product_images" })
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const detail = product as ProductDetail;
  const images = detail.product_images ?? [];
  const cover = images[0]?.image_url ?? "/legacy/product1.png";
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-emerald-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={detail.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-3 gap-3">
              {images.slice(0, 3).map((image) => (
                <div
                  key={image.image_url}
                  className="aspect-[4/3] overflow-hidden rounded-2xl bg-emerald-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.image_url} alt={detail.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-emerald-900">{detail.name}</h1>
            {detail.category ? (
              <Link
                href={`/category/${detail.category.slug}`}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {detail.category.name}
              </Link>
            ) : null}
          </div>
          <div className="text-2xl font-semibold text-emerald-700">
            {formatter.format(Number(detail.price))}
          </div>
          <p className="text-sm text-slate-600">
            {detail.description ?? "Sản phẩm chưa có mô tả chi tiết."}
          </p>
          <div className="text-sm text-slate-500">
            {detail.stock > 0 ? `Còn lại ${detail.stock} sản phẩm.` : "Tạm hết hàng."}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Liên hệ shop
            </Link>
            <Link
              href="/shop"
              className="rounded-full border border-emerald-600 px-6 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Xem thêm sản phẩm
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
