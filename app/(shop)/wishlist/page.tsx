import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type WishlistProduct = {
  id: string;
  name: string;
  price: number;
  product_images: { image_url: string | null }[] | null;
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: wishlistRows } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id);
  const productIds = (wishlistRows ?? []).map((row) => row.product_id as string);

  let products: WishlistProduct[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, product_images(image_url)")
      .in("id", productIds)
      .order("sort_order", { ascending: true, foreignTable: "product_images" });
    products = (data ?? []) as WishlistProduct[];
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-emerald-700">Danh sách yêu thích</h1>
      <p className="mt-4 text-base text-slate-600">Danh sách yêu thích sẽ hiển thị các sản phẩm bạn đã lưu.</p>

      <div className="mt-6 grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-4 rounded border p-3">
            <div className="h-16 w-16 overflow-hidden rounded bg-emerald-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.product_images?.[0]?.image_url ?? "/legacy/product1.png"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-emerald-800">{product.name}</div>
              <div className="text-sm text-slate-600">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(product.price))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
