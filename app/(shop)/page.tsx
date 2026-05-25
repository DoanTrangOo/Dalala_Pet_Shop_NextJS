import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  product_images: { image_url: string; sort_order: number }[] | null;
};

const categories = [
  { label: "Chó", slug: "dogs", image: "/legacy/cat1.png" },
  { label: "Mèo", slug: "cats", image: "/legacy/cat2.png" },
  { label: "Động vật nhỏ", slug: "other", image: "/legacy/cat3.png" },
];

const steps = [
  {
    number: "01",
    title: "Nhà giữ \"Boss\"",
    description:
      "Thứ hai - Thứ sáu / 7:30 - 19:30. Thứ bảy + Chủ nhật / 9:00 - 17:00. Boss được chơi đùa cùng bạn bè trong phòng dưới sự giám sát của chúng tôi.",
  },
  {
    number: "02",
    title: "Đi dạo",
    description:
      "Thứ hai - Thứ sáu / 8:00 - 18:00. Các chuyên gia sẽ cho các boss đi dạo theo từng nhóm nhỏ.",
  },
  {
    number: "03",
    title: "Làm đẹp",
    description:
      "Thứ hai - Thứ sáu / 9:00 - 19:00. Dịch vụ làm đẹp mang đến sự tiện lợi, thoải mái và phong cách.",
  },
  {
    number: "04",
    title: "Khách sạn của \"Boss\"",
    description:
      "Thứ hai - Thứ bảy / 24h. Dịch vụ khách sạn giúp các sen yên tâm khi đi công tác.",
  },
  {
    number: "05",
    title: "Huấn luyện",
    description:
      "Mỗi buổi huấn luyện kéo dài 60 phút. Hỗ trợ các boss sửa đổi hành vi và nâng cao vâng lời.",
  },
  {
    number: "06",
    title: "Thú y",
    description:
      "Thứ hai - Chủ nhật / 8:00 - 18:00. Dalala luôn sẵn sàng hỗ trợ nhu cầu sức khỏe cho thú cưng.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, product_images(image_url, sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const items = (products ?? []) as ProductCard[];
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-emerald-50">
        <div className="absolute inset-0">
          <Image
            src="/legacy/home-bg.jpg"
            alt="Dalala Pet Store"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/70" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl px-6 py-20">
          <div className="max-w-xl rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-lg">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Tạo sự kết nối giữa chủ và thú nuôi
            </span>
            <h1 className="mt-4 text-3xl font-semibold text-emerald-900 sm:text-4xl">
              Đáng tin cậy để có chỗ trông thú cưng miễn phí
            </h1>
            <p className="mt-4 text-base text-slate-600">
              Bạn đang thất vọng vì tìm các dịch vụ chăm sóc thú cưng an toàn, giá cả phải chăng?
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Hãy tham gia với chúng tôi!
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-emerald-900">Danh sách theo loài</h2>
          <p className="mt-2 text-sm text-slate-600">
            Chọn nhanh các nhóm thú cưng phổ biến tại Dalala.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.slug}
              className="rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50">
                <Image
                  src={category.image}
                  alt={category.label}
                  width={84}
                  height={84}
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-emerald-900">
                {category.label}
              </h3>
              <Link
                href={`/category/${category.slug}`}
                className="mt-4 inline-flex rounded-full border border-emerald-600 px-5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
              >
                Vào mua
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-emerald-50">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.1fr]">
          <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white">
            <Image
              src="/legacy/about1.jpg"
              alt="Dalala" 
              width={600}
              height={540}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold text-emerald-900">
              Dalala đảm bảo rằng!!!<br />Boss vui,<br />Sen cũng vui
            </h2>
            <p className="text-base text-slate-600">
              Dalala là một cửa hàng đặc biệt cung cấp và tuyển chọn các sản phẩm chất lượng cho thú cưng. Với
              cửa hàng truyền thống và cửa hàng trực tuyến, Dalala luôn đảm bảo cho thú cưng bạn có nguồn dinh dưỡng tốt.
            </p>
            <p className="text-base text-slate-600">
              Dalala cũng thiết kế và sản xuất dòng sản phẩm dành cho thú cưng, bao gồm lồng, vòng cổ, dây dắt,
              phụ kiện, quần áo, đồ ăn vặt, v.v.
            </p>
            <Link
              href="/shop"
              className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Khám phá
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-emerald-900">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="text-center text-white">
            <h2 className="text-2xl font-semibold">Dalala chuyên về</h2>
            <p className="mt-2 text-sm text-emerald-100">
              Dịch vụ và tiện ích giúp boss khỏe mạnh mỗi ngày.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-3xl border border-emerald-700/40 bg-emerald-800/60 p-6 text-white"
              >
                <div className="text-sm font-semibold text-emerald-200">{step.number}</div>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm text-emerald-100">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-emerald-900">Sản phẩm gần đây</h2>
          <p className="mt-2 text-sm text-slate-600">
            Một số sản phẩm mới nhất tại Dalala Pet Store.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-500">
              Hiện tại chưa có sản phẩm nào.
            </div>
          ) : (
            items.map((product) => {
              const cover = product.product_images?.[0]?.image_url ?? "/legacy/product1.png";

              return (
                <div
                  key={product.id}
                  className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"
                >
                  <div className="text-sm font-semibold text-emerald-700">
                    {formatter.format(Number(product.price))}
                  </div>
                  <Link href={`/product/${product.slug}`} className="mt-4 block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-emerald-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-emerald-900">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      defaultValue={1}
                      className="w-16 rounded-full border border-emerald-100 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      className="rounded-full border border-emerald-600 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                    >
                      Yêu thích
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
