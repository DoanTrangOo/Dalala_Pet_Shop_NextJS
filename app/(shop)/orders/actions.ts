"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type UploadProofState = {
  error?: string;
  success?: string;
};

async function ensurePaymentProofBucket() {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return null;
  }

  const { data } = await adminClient.storage.getBucket("payment-proofs");
  if (data) {
    return adminClient;
  }

  await adminClient.storage.createBucket("payment-proofs", { public: true });
  return adminClient;
}

export async function uploadPaymentProofAction(
  _prevState: UploadProofState,
  formData: FormData
): Promise<UploadProofState> {
  const orderId = String(formData.get("orderId") ?? "");
  const file = formData.get("proofFile");

  if (!orderId) {
    return { error: "Thiếu mã đơn hàng." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vui lòng chọn ảnh minh chứng chuyển khoản." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Minh chứng phải là file ảnh." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, payment_method, payment_status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (orderError || !order) {
    return { error: "Không tìm thấy đơn hàng hợp lệ." };
  }

  if (order.payment_method !== "bank_transfer") {
    return { error: "Đơn này không yêu cầu minh chứng chuyển khoản." };
  }

  if (!["awaiting_transfer", "proof_submitted", "failed"].includes(order.payment_status ?? "")) {
    return { error: "Đơn này không thể upload minh chứng ở trạng thái hiện tại." };
  }

  const adminClient = await ensurePaymentProofBucket();
  if (!adminClient) {
    return { error: "Thiếu SUPABASE_SERVICE_ROLE_KEY để upload minh chứng." };
  }

  const fileExt = file.name.split(".").pop() ?? "png";
  const filePath = `${orderId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await adminClient.storage
    .from("payment-proofs")
    .upload(filePath, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrl } = adminClient.storage.from("payment-proofs").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_proof_url: publicUrl.publicUrl,
      payment_proof_path: filePath,
      payment_proof_uploaded_at: new Date().toISOString(),
      payment_status: "proof_submitted",
    })
    .eq("id", orderId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  return { success: "Đã gửi minh chứng chuyển khoản." };
}
