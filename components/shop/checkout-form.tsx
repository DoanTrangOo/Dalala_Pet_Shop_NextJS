"use client";

import { useActionState, useMemo, useState } from "react";

import { placeOrderAction } from "@/app/(shop)/checkout/actions";
import { Button } from "@/components/ui/button";

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

type CheckoutFormProps = {
  addresses: AddressRow[];
  totalFormatted: string;
};

const emptyState = {} as { error?: string };

export default function CheckoutForm({ addresses, totalFormatted }: CheckoutFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  const [state, formAction, isPending] = useActionState(placeOrderAction, emptyState);

  const defaultAddressId = useMemo(() => {
    const explicit = addresses.find((address) => address.is_default);
    return explicit?.id ?? addresses[0]?.id ?? "";
  }, [addresses]);

  return (
    <form action={formAction} className="space-y-5 rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-emerald-800">Thông tin giao hàng</h2>
        <p className="text-sm text-slate-600">Chọn địa chỉ và phương thức thanh toán cho đơn hàng của bạn.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Địa chỉ nhận hàng</label>
        <select
          name="addressId"
          defaultValue={defaultAddressId}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {`${address.recipient_name} - ${address.phone} | ${[
                address.address_line1,
                address.ward,
                address.district,
                address.city,
              ]
                .filter(Boolean)
                .join(", ")}`}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Phương thức thanh toán</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="paymentMethod"
            value="cod"
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
          />
          Thanh toán khi nhận hàng (COD)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="paymentMethod"
            value="bank_transfer"
            checked={paymentMethod === "bank_transfer"}
            onChange={() => setPaymentMethod("bank_transfer")}
          />
          Chuyển khoản trước
        </label>
      </div>

      {paymentMethod === "bank_transfer" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">Quét mã QR để chuyển khoản</p>
          <p className="mt-1 text-xs text-emerald-700">
            Nội dung chuyển khoản: tên + số điện thoại để admin đối soát đơn.
          </p>
          <div className="mt-3 max-w-xs overflow-hidden rounded-lg border bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/legacy/admin-qr.svg" alt="QR thanh toán" className="h-full w-full object-contain" />
          </div>
          <p className="mt-3 text-xs text-emerald-700">
            Sau khi đặt đơn, bạn có thể tải lên minh chứng chuyển khoản trong trang theo dõi đơn hàng.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-3">
        <span className="text-sm font-medium text-slate-700">Tổng thanh toán</span>
        <span className="text-lg font-semibold text-emerald-700">{totalFormatted}</span>
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang xử lý..." : "Đặt mua"}
      </Button>
    </form>
  );
}
