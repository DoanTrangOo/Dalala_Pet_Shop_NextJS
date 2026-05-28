"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type WishlistActionState = {
  error?: string;
  success?: string;
  inWishlist?: boolean;
};

function normalizeMutationError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("violates foreign key constraint") || lower.includes("accounts")) {
    return "Dữ liệu tài khoản chưa đồng bộ. Hãy chạy migration mới nhất rồi thử lại.";
  }
  return message;
}

async function addToCartForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  productId: string,
  quantity: number
) {
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let cartId = cart?.id ?? null;

  if (!cartId) {
    const { data, error } = await supabase
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (error) {
      return normalizeMutationError(error.message);
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
      return normalizeMutationError(error.message);
    }
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
    });

    if (error) {
      return normalizeMutationError(error.message);
    }
  }

  return null;
}

export async function addToCartAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const quantityValue = Number(formData.get("quantity") ?? 1);
  const quantity = Number.isFinite(quantityValue) ? Math.max(1, Math.floor(quantityValue)) : 1;

  if (!productId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const error = await addToCartForUser(supabase, user.id, productId, quantity);
  if (error) {
    return;
  }

  revalidatePath("/cart");
}

export async function buyNowAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const quantityValue = Number(formData.get("quantity") ?? 1);
  const quantity = Number.isFinite(quantityValue) ? Math.max(1, Math.floor(quantityValue)) : 1;

  if (!productId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const error = await addToCartForUser(supabase, user.id, productId, quantity);
  if (error) {
    return;
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");
  redirect("/checkout");
}

export async function addToWishlistAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");

  if (!productId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing?.id) {
    return;
  }

  const { error } = await supabase.from("wishlists").insert({
    user_id: user.id,
    product_id: productId,
  });

  if (error) {
    return;
  }

  revalidatePath("/wishlist");
}

export async function toggleWishlistAction(
  formData: FormData
): Promise<WishlistActionState> {
  const productId = String(formData.get("productId") ?? "");

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

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("wishlists").delete().eq("id", existing.id);
    if (error) {
      return { error: normalizeMutationError(error.message) };
    }
    revalidatePath("/wishlist");
    return { success: "Removed from wishlist.", inWishlist: false };
  }

  const { error } = await supabase.from("wishlists").insert({
    user_id: user.id,
    product_id: productId,
  });

  if (error) {
    return { error: normalizeMutationError(error.message) };
  }

  revalidatePath("/wishlist");
  return { success: "Added to wishlist.", inWishlist: true };
}
