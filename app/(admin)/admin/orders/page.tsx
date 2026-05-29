import { reviewPaymentProofAction, updateOrderProgressAction } from "@/app/(admin)/actions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type OrderRow = {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  payment_method?: "cod" | "bank_transfer";
  payment_status?: "pending" | "awaiting_transfer" | "proof_submitted" | "paid" | "failed";
  payment_proof_url?: string | null;
  payment_review_note?: string | null;
  total_amount: number;
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
  profile:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, user_id, status, payment_method, payment_status, payment_proof_url, payment_review_note, total_amount, shipping_address, created_at, order_items(id, product_name, unit_price, quantity)"
    )
    .order("created_at", { ascending: false });

  if (ordersError) {
    return (
      <main className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Quản lý đơn hàng</h1>
          <p className="text-sm text-destructive">Không thể tải danh sách đơn hàng: {ordersError.message}</p>
        </div>
      </main>
    );
  }

  const orders = (ordersData ?? []) as Omit<OrderRow, "profile">[];
  const userIds = Array.from(new Set(orders.map((order) => order.user_id)));

  let profileMap = new Map<string, { full_name: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    profileMap = new Map((profiles ?? []).map((profile) => [profile.id as string, { full_name: profile.full_name as string | null }]));
  }

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Quản lý đơn hàng</h1>
        <p className="text-sm text-muted-foreground">
          Xử lý đơn, cập nhật giao hàng và trạng thái thanh toán.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const profile = profileMap.get(order.user_id) ?? null;

          return (
            <article key={order.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Đơn #{order.id}</p>
                  <p className="text-sm text-slate-600">Khách: {profile?.full_name || order.user_id}</p>
                  <p className="text-sm text-slate-600">
                    {new Date(order.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <p className="text-lg font-semibold text-emerald-700">
                  {formatter.format(Number(order.total_amount))}
                </p>
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Sản phẩm</p>
                  {(order.order_items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-slate-700">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span>{formatter.format(Number(item.unit_price) * item.quantity)}</span>
                    </div>
                  ))}

                  <p className="pt-2 text-sm text-slate-700">
                    Giao đến: {[
                      order.shipping_address?.recipient_name,
                      order.shipping_address?.phone,
                      order.shipping_address?.address_line1,
                      order.shipping_address?.ward,
                      order.shipping_address?.district,
                      order.shipping_address?.city,
                    ]
                      .filter(Boolean)
                      .join(" | ") || "-"}
                  </p>
                  <p className="text-sm text-slate-700">
                    Phương thức: {order.payment_method === "bank_transfer" ? "Chuyển khoản" : "COD"}
                  </p>
                  {order.payment_method === "bank_transfer" ? (
                    <div className="space-y-2 rounded-lg border bg-white p-3">
                      <p className="text-sm font-semibold text-slate-800">Minh chứng chuyển khoản</p>
                      {order.payment_proof_url ? (
                        <div className="overflow-hidden rounded-md border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={order.payment_proof_url} alt="Payment proof" className="h-40 w-full object-contain" />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Chưa có minh chứng.</p>
                      )}
                      {order.payment_review_note ? (
                        <p className="text-xs text-slate-500">Ghi chú: {order.payment_review_note}</p>
                      ) : null}
                      <form action={reviewPaymentProofAction} className="space-y-2">
                        <input type="hidden" name="id" value={order.id} />
                        <input
                          type="text"
                          name="reviewNote"
                          placeholder="Ghi chú duyệt"
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button type="submit" name="decision" value="approve" size="sm">
                            Duyệt
                          </Button>
                          <Button type="submit" name="decision" value="reject" size="sm" variant="destructive">
                            Từ chối
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : null}
                </div>

                <form action={updateOrderProgressAction} className="space-y-3 rounded-lg border bg-slate-50 p-3">
                  <input type="hidden" name="id" value={order.id} />
                  <div>
                    <label className="text-sm font-medium">Trạng thái đơn</label>
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái thanh toán</label>
                    <select
                      name="paymentStatus"
                      defaultValue={order.payment_status ?? "pending"}
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="awaiting_transfer">Awaiting transfer</option>
                      <option value="proof_submitted">Proof submitted</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm">Cập nhật</Button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
