import type { ReactNode } from "react";
import { Dosis } from "next/font/google";

import { SiteFooter } from "@/components/shop/site-footer";
import { SiteHeader } from "@/components/shop/site-header";

const dosis = Dosis({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

type ShopLayoutProps = {
  children: ReactNode;
};

export default function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className={`${dosis.className} bg-[#f9faf7] text-slate-800`}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
