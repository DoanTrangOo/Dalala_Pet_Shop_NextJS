import { redirect } from "next/navigation";

import ProfileManagement from "@/components/shop/profile-management";
import { createClient } from "@/lib/supabase/server";

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

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("shipping_addresses")
      .select("id, recipient_name, phone, address_line1, ward, district, city, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold text-emerald-700">Quản lý tài khoản</h1>
        <p className="text-sm text-slate-600">
          Cập nhật thông tin cá nhân, đổi mật khẩu và quản lý địa chỉ nhận hàng.
        </p>
      </div>

      <ProfileManagement
        email={user.email ?? ""}
        fullName={profile?.full_name ?? ""}
        addresses={(addresses ?? []) as AddressRow[]}
      />
    </main>
  );
}
