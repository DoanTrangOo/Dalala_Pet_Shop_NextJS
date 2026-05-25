"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type CartActionState = {
  error?: string;
  success?: string;
};

export async function addToCartAction(formData: FormData): Promise<CartActionState> {
  const productId = String(formData.get("productId") ?? "");
  const quantityValue = Number(formData.get("quantity") ?? 1);
  const quantity = Number.isFinite(quantityValue) ? Math.max(1, Math.floor(quantityValue)) : 1;

  if (!productId) {
    return { error: "Missing product id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let cartId = cart?.id ?? null;

  if (!cartId) {
    const { data, error } = await supabase
      .from("carts")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (error) {
      return { error: error.message };
    }

    cartId = data.id;
  }

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingItem) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/cart");
  return { success: "Added to cart." };
}
