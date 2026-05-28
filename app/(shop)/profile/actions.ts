"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ProfileActionState = {
  error?: string;
  success?: string;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "Bạn cần đăng nhập." };
  }

  return { supabase, user, error: null };
}

export async function updatePasswordAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 8) {
    return { error: "Mật khẩu phải có ít nhất 8 ký tự." };
  }

  if (password !== confirmPassword) {
    return { error: "Mật khẩu xác nhận không khớp." };
  }

  const guard = await requireUser();
  if (guard.error) {
    return { error: guard.error };
  }
  const user = guard.user;
  if (!user) {
    return { error: "Bạn cần đăng nhập." };
  }

  const { error } = await guard.supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: "Đổi mật khẩu thành công." };
}

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName) {
    return { error: "Họ tên không được để trống." };
  }

  const guard = await requireUser();
  if (guard.error) {
    return { error: guard.error };
  }
  const user = guard.user;
  if (!user) {
    return { error: "Bạn cần đăng nhập." };
  }

  const { error } = await guard.supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName }, { onConflict: "id" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: "Đã cập nhật thông tin tài khoản." };
}

export async function createAddressAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const ward = String(formData.get("ward") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const isDefault = String(formData.get("isDefault") ?? "") === "on";

  if (!recipientName || !phone || !addressLine1 || !city) {
    return { error: "Vui lòng nhập đủ thông tin bắt buộc của địa chỉ." };
  }

  const guard = await requireUser();
  if (guard.error) {
    return { error: guard.error };
  }
  const user = guard.user;
  if (!user) {
    return { error: "Bạn cần đăng nhập." };
  }

  if (isDefault) {
    await guard.supabase
      .from("shipping_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { error } = await guard.supabase.from("shipping_addresses").insert({
    user_id: user.id,
    recipient_name: recipientName,
    phone,
    address_line1: addressLine1,
    ward: ward || null,
    district: district || null,
    city,
    is_default: isDefault,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { success: "Đã thêm địa chỉ nhận hàng." };
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const addressId = String(formData.get("id") ?? "");
  if (!addressId) {
    return;
  }

  const guard = await requireUser();
  if (guard.error) {
    return;
  }
  const user = guard.user;
  if (!user) {
    return;
  }

  await guard.supabase
    .from("shipping_addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);

  const { error } = await guard.supabase
    .from("shipping_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) {
    return;
  }

  revalidatePath("/profile");
  revalidatePath("/checkout");
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const addressId = String(formData.get("id") ?? "");
  if (!addressId) {
    return;
  }

  const guard = await requireUser();
  if (guard.error) {
    return;
  }
  const user = guard.user;
  if (!user) {
    return;
  }

  const { error } = await guard.supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) {
    return;
  }

  revalidatePath("/profile");
  revalidatePath("/checkout");
}
