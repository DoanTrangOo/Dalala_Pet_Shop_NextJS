"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { categorySchema, productSchema } from "./schemas";

type ActionState = {
  error?: string;
  success?: string;
};

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureProductsBucket() {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return;
  }

  const { data } = await adminClient.storage.getBucket("products");
  if (data) {
    return;
  }

  await adminClient.storage.createBucket("products", { public: true });
}

async function getAdminGuard() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { supabase, user: null, error: "Admin access required." };
  }

  return { supabase, user, error: null };
}

export async function createCategoryAction(formData: FormData): Promise<ActionState> {
  const guard = await getAdminGuard();
  if (guard.error) return { error: guard.error };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? createSlug(String(formData.get("name") ?? "")),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category data." };
  }

  const { error } = await guard.supabase.from("categories").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  return { success: "Category created." };
}

export async function updateCategoryAction(formData: FormData): Promise<ActionState> {
  const guard = await getAdminGuard();
  if (guard.error) return { error: guard.error };

  const categoryId = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? createSlug(String(formData.get("name") ?? "")),
    description: formData.get("description") ?? "",
  });

  if (!categoryId) return { error: "Category id is required." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category data." };
  }

  const { error } = await guard.supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", categoryId);

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  return { success: "Category updated." };
}

export async function deleteCategoryAction(formData: FormData): Promise<ActionState> {
  const guard = await getAdminGuard();
  if (guard.error) return { error: guard.error };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Category id is required." };

  const { error } = await guard.supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  return { success: "Category deleted." };
}

export async function saveProductAction(formData: FormData): Promise<ActionState> {
  const guard = await getAdminGuard();
  if (guard.error) return { error: guard.error };

  const parsed = productSchema.safeParse({
    id: formData.get("id") ?? undefined,
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug") ?? createSlug(String(formData.get("name") ?? "")),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    stock: formData.get("stock"),
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }

  const { id, ...productValues } = parsed.data;
  const now = new Date().toISOString();
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  let productId = id;

  if (!productId) {
    const { data, error } = await guard.supabase
      .from("products")
      .insert({
        category_id: productValues.categoryId,
        name: productValues.name,
        slug: productValues.slug,
        description: productValues.description,
        price: productValues.price,
        stock: productValues.stock,
        is_active: productValues.isActive,
        created_at: now,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    productId = data.id;
  } else {
    const { error } = await guard.supabase
      .from("products")
      .update({
        category_id: productValues.categoryId,
        name: productValues.name,
        slug: productValues.slug,
        description: productValues.description,
        price: productValues.price,
        stock: productValues.stock,
        is_active: productValues.isActive,
      })
      .eq("id", productId);

    if (error) return { error: error.message };
  }

  if (files.length > 0) {
    await ensureProductsBucket();
  }

  for (const file of files) {
    const fileExt = file.name.split(".").pop() ?? "png";
    const filePath = `${productId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await guard.supabase.storage
      .from("products")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return { error: uploadError.message };

    const { data } = guard.supabase.storage.from("products").getPublicUrl(filePath);

    const { error: imageError } = await guard.supabase.from("product_images").insert({
      product_id: productId,
      image_url: data.publicUrl,
      sort_order: 0,
    });

    if (imageError) return { error: imageError.message };
  }

  revalidatePath("/admin/products");
  return { success: id ? "Product updated." : "Product created." };
}

export async function deleteProductAction(formData: FormData): Promise<ActionState> {
  const guard = await getAdminGuard();
  if (guard.error) return { error: guard.error };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Product id is required." };

  const { error } = await guard.supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  return { success: "Product deleted." };
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const guard = await getAdminGuard();
  if (guard.error) return;

  const userId = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId) {
    return;
  }

  if (!role || (role !== "admin" && role !== "customer")) {
    return;
  }

  const { error } = await guard.supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) {
    return;
  }

  revalidatePath("/admin/users");
}

export async function updateOrderProgressAction(formData: FormData): Promise<void> {
  const guard = await getAdminGuard();
  if (guard.error) return;

  const orderId = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "");

  if (!orderId) {
    return;
  }

  if (!["pending", "paid", "shipped", "completed", "cancelled"].includes(status)) {
    return;
  }

  if (!["pending", "awaiting_transfer", "proof_submitted", "paid", "failed"].includes(paymentStatus)) {
    return;
  }

  const { error } = await guard.supabase
    .from("orders")
    .update({ status, payment_status: paymentStatus })
    .eq("id", orderId);

  if (error) {
    return;
  }

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}

export async function reviewPaymentProofAction(formData: FormData): Promise<void> {
  const guard = await getAdminGuard();
  if (guard.error) return;

  const orderId = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();

  if (!orderId) {
    return;
  }

  if (decision !== "approve" && decision !== "reject") {
    return;
  }

  const nextOrderUpdate =
    decision === "approve"
      ? { payment_status: "paid", status: "paid", payment_reviewed_at: new Date().toISOString(), payment_review_note: reviewNote || null }
      : { payment_status: "failed", status: "pending", payment_reviewed_at: new Date().toISOString(), payment_review_note: reviewNote || "Minh chứng không hợp lệ." };

  const { error } = await guard.supabase.from("orders").update(nextOrderUpdate).eq("id", orderId);
  if (error) {
    return;
  }

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}
