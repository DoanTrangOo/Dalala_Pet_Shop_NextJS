"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logoutAction } from "@/app/(auth)/actions";

type AvatarMenuProps = {
  userEmail?: string | null;
  isAdmin?: boolean;
};

export default function AvatarMenu({ userEmail, isAdmin = false }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative">
      <button
        aria-label="Account"
        onClick={() => setOpen((s) => !s)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white p-2 shadow">
          {isAdmin ? (
            <button
              className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-emerald-50"
              onClick={() => {
                router.push("/admin");
                setOpen(false);
              }}
            >
              Quản lý
            </button>
          ) : null}
          <button
            className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-emerald-50"
            onClick={() => {
              router.push("/profile");
              setOpen(false);
            }}
          >
            Quản lý tài khoản
          </button>
          <button
            className="block w-full rounded px-2 py-1 text-left text-sm text-destructive hover:bg-destructive/10"
            onClick={async () => {
              const result = await logoutAction();
              setOpen(false);
              if (result?.redirectTo) {
                router.push(result.redirectTo);
              }
            }}
          >
            Đăng xuất
          </button>
        </div>
      ) : null}
    </div>
  );
}
