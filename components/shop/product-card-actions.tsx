"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

import { buyNowAction, toggleWishlistAction } from "@/app/(shop)/actions";

type ProductCardActionsProps = {
  productId: string;
  initialInWishlist?: boolean;
};

export default function ProductCardActions({
  productId,
  initialInWishlist = false,
}: ProductCardActionsProps) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleWishlist = () => {
    setWishlistError(null);
    const formData = new FormData();
    formData.set("productId", productId);

    startTransition(async () => {
      const result = await toggleWishlistAction(formData);
      if (result?.error) {
        setWishlistError(result.error);
        return;
      }
      if (typeof result?.inWishlist === "boolean") {
        setInWishlist(result.inWishlist);
      }
    });
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-3">
        <form action={buyNowAction}>
          <input type="hidden" name="productId" value={productId} />
          <button
            type="submit"
            className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            Mua ngay
          </button>
        </form>
        <button
          type="button"
          aria-label="Yeu thich"
          aria-pressed={inWishlist}
          onClick={handleToggleWishlist}
          disabled={isPending}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
            inWishlist
              ? "border-rose-200 bg-rose-50 text-rose-500"
              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Heart className="h-4 w-4" fill={inWishlist ? "currentColor" : "none"} />
        </button>
      </div>
      {wishlistError ? <p className="text-xs text-destructive">{wishlistError}</p> : null}
    </div>
  );
}
