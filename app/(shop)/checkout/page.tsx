import Link from "next/link";
import { redirect } from "next/navigation";

import CheckoutForm from "@/components/shop/checkout-form";
import { createClient } from "@/lib/supabase/server";

type CartItem = {
  id: string;
  quantity: number;
  product:
    | {
        id: string;
        name: string;
        slug: string;
        price: number;
      }
    | {
        id: string;
        name: string;
        slug: string;
        price: number;
      }[]
    | null;
};

type AddressRow = {
  id: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  ward: string | null;
  district: string | null;
  city: string;
  is_default: boolean;
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const [{ data: cart }, { data: addresses }] = await Promise.all([
    supabase
      .from("carts")
      .select("id, cart_items(id, quantity, product:products(id, name, slug, price))")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("shipping_addresses")
      .select("id, recipient_name, phone, address_line1, ward, district, city, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const rawItems = (cart?.cart_items ?? []) as CartItem[];
  const items = rawItems
    .map((item) => {
      const product = Array.isArray(item.product)
        ? item.product[0] ?? null
        : item.product;
      return { ...item, product };
    })
    .filter((item) => item.product && item.quantity > 0);

  const total = items.reduce((sum, item) => sum + Number(item.product?.price ?? 0) * item.quantity, 0);
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold text-emerald-700">Thanh toán</h1>
        <p className="text-sm text-slate-600">Xác nhận đơn hàng, chọn địa chỉ và phương thức thanh toán.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-slate-600">
          Giỏ hàng đang trống. <Link href="/shop" className="font-semibold text-emerald-700">Tiếp tục mua sắm</Link>
        </div>
      ) : addresses && addresses.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <CheckoutForm addresses={(addresses ?? []) as AddressRow[]} totalFormatted={formatter.format(total)} />
          <aside className="space-y-3 rounded-xl border bg-white p-5">
            <h2 className="text-lg font-semibold text-emerald-800">Đơn hàng của bạn</h2>
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{item.product?.name}</p>
                  <p className="text-slate-500">SL: {item.quantity}</p>
                </div>
                <p className="font-semibold text-emerald-700">
                  {formatter.format(Number(item.product?.price ?? 0) * item.quantity)}
                </p>
              </div>
            ))}
          </aside>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-6 text-sm text-slate-600">
          Bạn chưa có địa chỉ nhận hàng. Vui lòng thêm địa chỉ trong
          <Link href="/profile" className="ml-1 font-semibold text-emerald-700">trang tài khoản</Link>.
        </div>
      )}
    </main>
  );
}
