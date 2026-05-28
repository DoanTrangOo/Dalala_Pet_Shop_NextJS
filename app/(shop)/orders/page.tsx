import Link from "next/link";
import { redirect } from "next/navigation";

import ProductCardActions from "@/components/shop/product-card-actions";
import PaymentProofUpload from "@/components/shop/payment-proof-upload";
import { createClient } from "@/lib/supabase/server";

type OrderRow = {
  id: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  payment_method?: "cod" | "bank_transfer";
  payment_status?: "pending" | "awaiting_transfer" | "paid" | "failed";
  total_amount: number;
  payment_proof_url?: string | null;
  shipping_address: {
    recipient_name?: string;
    phone?: string;
    address_line1?: string;
    ward?: string;
    district?: string;
    city?: string;
  } | null;
  created_at: string;
  order_items:
    | {
        id: string;
        product_name: string;
        unit_price: number;
        quantity: number;
      }[]
    | null;
};

const statusLabel: Record<string, string> = {
  pending: "Đang chờ xử lý",
  paid: "Đã thanh toán",
  shipped: "Đang giao hàng",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const paymentLabel: Record<string, string> = {
  pending: "Chờ thanh toán",
  awaiting_transfer: "Chờ chuyển khoản",
  paid: "Đã thanh toán",
  failed: "Thanh toán lỗi",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, payment_method, payment_status, payment_proof_url, total_amount, shipping_address, created_at, order_items(id, product_name, unit_price, quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: sampleProducts } = await supabase
    .from("products")
    .select("id, name, slug, price, product_images(image_url, sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("sort_order", { ascending: true, foreignTable: "product_images" })
    .limit(3);

  const sampleProductIds = (sampleProducts ?? []).map((product) => product.id);
  const { data: sampleWishlistRows } = sampleProductIds.length
    ? await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user.id)
        .in("product_id", sampleProductIds)
    : { data: [] };
  const sampleWishlistIds = new Set((sampleWishlistRows ?? []).map((row) => row.product_id as string));

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold text-emerald-700">Theo dõi đơn hàng</h1>
        <p className="text-sm text-slate-600">Xem trạng thái đơn hàng và thông tin giao nhận của bạn.</p>
      </div>

      {(orders ?? []).length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-slate-600">
          Bạn chưa có đơn hàng nào. <Link href="/shop" className="font-semibold text-emerald-700">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {(orders as OrderRow[]).map((order) => (
            <article key={order.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div>
                  <p className="text-sm text-slate-500">Mã đơn: {order.id}</p>
                  <p className="text-sm text-slate-500">
                    Ngày tạo: {new Date(order.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-700">
                    {statusLabel[order.status] ?? order.status}
                  </p>
                  <p className="text-xs text-slate-600">
                    {paymentLabel[order.payment_status ?? "pending"] ?? "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-800">Sản phẩm</h3>
                  {(order.order_items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span className="font-medium text-emerald-700">
                        {formatter.format(Number(item.unit_price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <p className="pt-2 text-sm font-semibold text-emerald-800">
                    Tổng tiền: {formatter.format(Number(order.total_amount))}
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
                  <h3 className="font-semibold text-slate-800">Giao đến</h3>
                  <p>{order.shipping_address?.recipient_name ?? "-"}</p>
                  <p>{order.shipping_address?.phone ?? "-"}</p>
                  <p>
                    {[
                      order.shipping_address?.address_line1,
                      order.shipping_address?.ward,
                      order.shipping_address?.district,
                      order.shipping_address?.city,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                  <p>
                    Thanh toán: {order.payment_method === "bank_transfer" ? "Chuyển khoản" : "COD"}
                  </p>
                  {order.payment_method === "bank_transfer" ? (
                    <PaymentProofUpload orderId={order.id} currentProofUrl={order.payment_proof_url ?? null} />
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-emerald-800">Sản phẩm gợi ý</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(sampleProducts ?? []).map((product) => {
            const cover = product.product_images?.[0]?.image_url ?? "/legacy/product1.png";
            return (
              <div key={product.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-emerald-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-emerald-900">{product.name}</h3>
                  <p className="text-sm text-emerald-700">
                    {formatter.format(Number(product.price))}
                  </p>
                </Link>
                <ProductCardActions
                  productId={product.id}
                  initialInWishlist={sampleWishlistIds.has(product.id)}
                />
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
