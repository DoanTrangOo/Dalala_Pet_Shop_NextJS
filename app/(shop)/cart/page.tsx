import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    product_images: { image_url: string; sort_order: number }[] | null;
  } | null;
};

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: cart } = await supabase
    .from("carts")
    .select(
      "id, cart_items(id, quantity, product:products(id, name, slug, price, product_images(image_url, sort_order)))"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const rawItems = cart?.cart_items as unknown as
    | (CartItem & { product: CartItem["product"] | CartItem["product"][] })[]
    | null;

  const items = ((rawItems ?? [])
    .map((item) => {
      const product = Array.isArray(item.product)
        ? item.product[0] ?? null
        : item.product;
      return { ...item, product };
    }) as CartItem[])
    .filter((item) => item.product);
  const total = items.reduce((sum, item) => {
    const price = Number(item.product?.price ?? 0);
    return sum + price * item.quantity;
  }, 0);
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold text-emerald-700">Giỏ hàng</h1>
        <p className="text-sm text-slate-600">
          Kiểm tra lại sản phẩm trước khi thanh toán.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-500">
          Giỏ hàng của bạn đang trống.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {items.map((item) => {
              const cover =
                item.product?.product_images?.[0]?.image_url ?? "/legacy/product1.png";
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="h-28 w-full overflow-hidden rounded-xl bg-emerald-50 sm:h-24 sm:w-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover}
                      alt={item.product?.name ?? "Sản phẩm"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Link
                      href={`/product/${item.product?.slug ?? ""}`}
                      className="text-base font-semibold text-emerald-900"
                    >
                      {item.product?.name}
                    </Link>
                    <div className="text-sm text-slate-600">
                      Số lượng: {item.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-700">
                    {formatter.format(Number(item.product?.price ?? 0) * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-6">
            <span className="text-sm font-semibold text-slate-600">Tổng cộng</span>
            <span className="text-lg font-semibold text-emerald-700">
              {formatter.format(total)}
            </span>
          </div>
          <div className="flex justify-end">
            <Link
              href="/checkout"
              className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Đặt mua
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
