"use client";

import { useActionState } from "react";

import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updatePasswordAction,
  updateProfileAction,
} from "@/app/(shop)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

type ProfileManagementProps = {
  email: string;
  fullName: string;
  addresses: AddressRow[];
};

const emptyState = {} as { error?: string; success?: string };

export default function ProfileManagement({ email, fullName, addresses }: ProfileManagementProps) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, emptyState);
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePasswordAction, emptyState);
  const [addressState, addressAction, addressPending] = useActionState(createAddressAction, emptyState);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-emerald-800">Thông tin tài khoản</h2>
        <form action={profileAction} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input value={email} disabled readOnly />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Họ tên</label>
            <Input name="fullName" defaultValue={fullName} required />
          </div>
          {profileState?.error ? <p className="text-sm text-destructive">{profileState.error}</p> : null}
          {profileState?.success ? <p className="text-sm text-emerald-700">{profileState.success}</p> : null}
          <Button type="submit" disabled={profilePending}>{profilePending ? "Đang lưu..." : "Lưu thông tin"}</Button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-emerald-800">Đổi mật khẩu</h2>
        <form action={passwordAction} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Mật khẩu mới</label>
            <Input name="password" type="password" required minLength={8} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nhập lại mật khẩu</label>
            <Input name="confirmPassword" type="password" required minLength={8} />
          </div>
          {passwordState?.error ? <p className="text-sm text-destructive">{passwordState.error}</p> : null}
          {passwordState?.success ? <p className="text-sm text-emerald-700">{passwordState.success}</p> : null}
          <Button type="submit" disabled={passwordPending}>{passwordPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-emerald-800">Địa chỉ nhận hàng</h2>
        <form action={addressAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <Input name="recipientName" placeholder="Tên người nhận" required />
          <Input name="phone" placeholder="Số điện thoại" required />
          <Input name="addressLine1" placeholder="Số nhà, tên đường" className="md:col-span-2" required />
          <Input name="ward" placeholder="Phường/Xã" />
          <Input name="district" placeholder="Quận/Huyện" />
          <Input name="city" placeholder="Tỉnh/Thành phố" required />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isDefault" /> Đặt làm mặc định
          </label>
          <div className="md:col-span-2">
            {addressState?.error ? <p className="text-sm text-destructive">{addressState.error}</p> : null}
            {addressState?.success ? <p className="text-sm text-emerald-700">{addressState.success}</p> : null}
            <Button type="submit" disabled={addressPending} className="mt-2">
              {addressPending ? "Đang thêm..." : "Thêm địa chỉ"}
            </Button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {addresses.length === 0 ? (
            <p className="text-sm text-slate-600">Bạn chưa có địa chỉ nhận hàng nào.</p>
          ) : (
            addresses.map((address) => (
              <div key={address.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {address.recipient_name} - {address.phone}
                    </p>
                    <p className="text-sm text-slate-600">
                      {[address.address_line1, address.ward, address.district, address.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {address.is_default ? (
                      <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Mặc định
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.is_default ? (
                      <form action={setDefaultAddressAction}>
                        <input type="hidden" name="id" value={address.id} />
                        <Button type="submit" size="sm" variant="outline">Mặc định</Button>
                      </form>
                    ) : null}
                    <form action={deleteAddressAction}>
                      <input type="hidden" name="id" value={address.id} />
                      <Button type="submit" size="sm" variant="destructive">Xóa</Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
