"use client";

import { useActionState } from "react";

import { uploadPaymentProofAction } from "@/app/(shop)/orders/actions";
import { Button } from "@/components/ui/button";

type PaymentProofUploadProps = {
  orderId: string;
  currentProofUrl?: string | null;
};

const emptyState = {} as { error?: string; success?: string };

export default function PaymentProofUpload({ orderId, currentProofUrl }: PaymentProofUploadProps) {
  const [state, formAction, isPending] = useActionState(uploadPaymentProofAction, emptyState);

  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-800">Minh chứng chuyển khoản</p>
      {currentProofUrl ? (
        <div className="mt-2 overflow-hidden rounded-md border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentProofUrl} alt="Minh chứng chuyển khoản" className="h-40 w-full object-contain" />
        </div>
      ) : null}
      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="orderId" value={orderId} />
        <input
          type="file"
          name="proofFile"
          accept="image/*"
          className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white"
          required
        />
        {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
        {state?.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Đang gửi..." : "Gửi minh chứng"}
        </Button>
      </form>
    </div>
  );
}
