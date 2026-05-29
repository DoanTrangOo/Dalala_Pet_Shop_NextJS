"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type PlaceOrderState = {
  error?: string;
};

export async function placeOrderAction(
  _prevState: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const addressId = String(formData.get("addressId") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "cod");

  if (!addressId) {
    return { error: "Vui lòng chọn địa chỉ nhận hàng." };
  }

  if (paymentMethod !== "cod" && paymentMethod !== "bank_transfer") {
    return { error: "Phương thức thanh toán không hợp lệ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const [{ data: address }, { data: cart }] = await Promise.all([
    supabase
      .from("shipping_addresses")
      .select("id, recipient_name, phone, address_line1, ward, district, city")
      .eq("id", addressId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("carts")
      .select("id, cart_items(id, quantity, product:products(id, name, price))")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!address) {
    return { error: "Không tìm thấy địa chỉ nhận hàng hợp lệ." };
  }

  const cartItems = (cart?.cart_items ?? []) as Array<{
    id: string;
    quantity: number;
    product:
      | {
          id: string;
          name: string;
          price: number;
        }
      | {
          id: string;
          name: string;
          price: number;
        }[]
      | null;
  }>;

  const normalized = cartItems
    .map((item) => {
      const product = Array.isArray(item.product)
        ? item.product[0] ?? null
        : item.product;
      return { ...item, product };
    })
    .filter((item) => item.product && item.quantity > 0);

  if (normalized.length === 0) {
    return { error: "Giỏ hàng trống, không thể đặt đơn." };
  }

  const totalAmount = normalized.reduce((sum, item) => {
    return sum + Number(item.product?.price ?? 0) * item.quantity;
  }, 0);

  const shippingAddress = {
    recipient_name: address.recipient_name,
    phone: address.phone,
    address_line1: address.address_line1,
    ward: address.ward,
    district: address.district,
    city: address.city,
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "bank_transfer" ? "awaiting_transfer" : "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Không thể tạo đơn hàng." };
  }

  const orderItems = normalized.map((item) => ({
    order_id: order.id,
    product_id: item.product!.id,
    product_name: item.product!.name,
    unit_price: Number(item.product!.price),
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    return { error: itemsError.message };
  }

  if (cart?.id) {
    await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");

  if (paymentMethod === "bank_transfer") {
    redirect(`/orders?order=${order.id}&payment=transfer`);
  }

  redirect(`/orders?order=${order.id}&payment=cod`);
}
