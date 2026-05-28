/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

type EnvMap = Record<string, string>;

function parseEnvFile(filePath: string): EnvMap {
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce<EnvMap>((env, line) => {
      const equalsIndex = line.indexOf("=");
      if (equalsIndex < 0) return env;

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (value.startsWith("\"") && value.endsWith("\"")) {
        value = value.slice(1, -1);
      } else if (value.startsWith("\'") && value.endsWith("\'")) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

function loadEnv() {
  const root = process.cwd();
  const envPaths = [".env.local", ".env"];

  for (const envPath of envPaths) {
    const absolutePath = path.join(root, envPath);
    if (fs.existsSync(absolutePath)) {
      const parsed = parseEnvFile(absolutePath);
      for (const [key, value] of Object.entries(parsed)) {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      console.log(`Loaded environment from ${envPath}`);
      return;
    }
  }

  console.warn("No .env.local or .env file found. Using existing process environment variables.");
}

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var ${key}. Please set it in .env.local or the environment.`);
  }
  return value;
}

async function findUserByEmail(supabase: ReturnType<typeof createClient>, email: string) {
  const listResult = await (supabase.auth.admin as any).listUsers({ query: email, limit: 100 });
  if (listResult.error) {
    throw listResult.error;
  }

  const users = (listResult.data?.users ?? []) as any[];
  return users.find((user) => String(user.email).toLowerCase() === email.toLowerCase()) ?? null;
}

async function deleteUserIfExists(supabase: ReturnType<typeof createClient>, email: string) {
  const existingUser = await findUserByEmail(supabase, email);
  if (!existingUser) {
    return null;
  }

  console.log(`Deleting existing user with email ${email}`);
  const { error } = await (supabase.auth.admin as any).deleteUser(existingUser.id);
  if (error) {
    throw error;
  }
  return existingUser.id;
}

async function createOrReplaceUser(
  supabase: ReturnType<typeof createClient>,
  email: string,
  password: string,
  role: string | null,
  fullName: string
) {
  await deleteUserIfExists(supabase, email);

  console.log(`Creating user ${email}`);
  const result = await (supabase.auth.admin as any).createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true,
  });

  if (result.error) {
    throw result.error;
  }

  const user = result.data?.user ?? result.data;
  if (!user || !user.id) {
    throw new Error(`Unexpected response while creating user ${email}`);
  }

  if (role) {
    console.log(`Updating profile role for ${email} -> ${role}`);
    const profileRow = { id: user.id, role, full_name: fullName } as any;
    const { error } = await supabase.from("profiles").upsert(profileRow, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }

  return user.id;
}

async function getOrCreateCategory(
  supabase: ReturnType<typeof createClient>,
  category: { name: string; slug: string; description: string }
) {
  const { data: existing, error: fetchError } = (await supabase
    .from("categories")
    .select("id")
    .eq("slug", category.slug)
    .maybeSingle()) as any;

  if (fetchError) {
    throw fetchError;
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = (await supabase
    .from("categories")
    .insert(category as any)
    .select("id")
    .single()) as any;

  if (error) {
    throw error;
  }

  return data.id;
}

async function upsertProduct(
  supabase: ReturnType<typeof createClient>,
  product: {
    categoryId: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    isActive: boolean;
    images: string[];
  }
) {
  const { data: existing, error: fetchError } = (await supabase
    .from("products")
    .select("id")
    .eq("slug", product.slug)
    .maybeSingle()) as any;

  if (fetchError) {
    throw fetchError;
  }

  let productId = existing?.id;
  if (productId) {
    const { error } = await (supabase.from("products") as any)
      .update({
        category_id: product.categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        is_active: product.isActive,
      })
      .eq("id", productId);

    if (error) {
      throw error;
    }
  } else {
    const { data, error } = (await supabase
      .from("products")
      .insert({
        category_id: product.categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        is_active: product.isActive,
      } as any)
      .select("id")
      .single()) as any;

    if (error) {
      throw error;
    }

    productId = data.id;
  }

  if (!productId) {
    throw new Error(`Could not resolve product id for ${product.name}`);
  }

  const { error: deleteImagesError } = (await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId)) as any;
  if (deleteImagesError) {
    throw deleteImagesError;
  }

  for (let index = 0; index < product.images.length; index += 1) {
    const url = product.images[index];
    const { error } = (await (supabase.from("product_images") as any).insert({
      product_id: productId,
      image_url: url,
      sort_order: index,
    })) as any;
    if (error) {
      throw error;
    }
  }

  return productId;
}

async function main() {
  loadEnv();

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as any;

  console.log("=== Seed Supabase Pet Shop Data ===");

  const adminUserId = await createOrReplaceUser(
    supabase,
    "admin@dlu.edu.vn",
    "12345678",
    "admin",
    "Admin Pet Shop"
  );

  const customerUserId = await createOrReplaceUser(
    supabase,
    "2100011@dlu.edu.vn",
    "12345678",
    null,
    "Customer Pet Shop"
  );

  console.log("Created users:", { adminUserId, customerUserId });

  const categories = [
    {
      name: "Thức ăn thú cưng",
      slug: "thuc-an-thu-cung",
      description: "Thực phẩm dinh dưỡng cho chó mèo với nhiều loại hạt, pate và snack phù hợp từng độ tuổi.",
    },
    {
      name: "Đồ chơi & Phụ kiện",
      slug: "do-choi-phu-kien",
      description: "Đồ chơi vận động và phụ kiện tiện nghi giúp thú cưng năng động, an toàn và thời trang.",
    },
    {
      name: "Chuồng & Đệm ngủ",
      slug: "chuong-dem-ngu",
      description: "Chuồng, giường và lót ngủ êm ái dành cho chó mèo mọi kích thước.",
    },
    {
      name: "Dịch vụ & Chăm sóc",
      slug: "dich-vu-cham-soc",
      description: "Dịch vụ tắm, cắt tỉa lông, chăm sóc sức khỏe và spa dành cho thú cưng.",
    },
  ];

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    categoryIds[category.slug] = await getOrCreateCategory(supabase, category);
  }

  const products = [
    {
      categorySlug: "thuc-an-thu-cung",
      name: "Hạt dinh dưỡng cho mèo trưởng thành",
      slug: "hat-dinh-duong-cho-meo-truong-thanh",
      description: "Thực đơn cân bằng với thịt gà, cá hồi và rau củ giúp mèo năng động và bộ lông bóng khỏe.",
      price: 399000,
      stock: 120,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "thuc-an-thu-cung",
      name: "Pate mềm cho chó con",
      slug: "pate-mem-cho-cho-con",
      description: "Pate thơm ngon sản xuất từ thịt gà và rau củ, dễ tiêu hoá cho chó con.",
      price: 289000,
      stock: 90,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "thuc-an-thu-cung",
      name: "Cát vệ sinh hương thảo cho mèo",
      slug: "cat-ve-sinh-huong-thao-cho-meo",
      description: "Cát khử mùi tự nhiên, bám cục tốt và tiện vệ sinh cho căn hộ nhỏ.",
      price: 159000,
      stock: 150,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1516382799247-6f1b4b28e954?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "thuc-an-thu-cung",
      name: "Snack xương gặm cho chó lớn",
      slug: "snack-xuong-gam-cho-cho-lon",
      description: "Xương gặm giàu canxi giúp làm sạch răng và giải trí cho chó trong ngày.",
      price: 79000,
      stock: 200,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1558944351-d9c5817d42b4?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "do-choi-phu-kien",
      name: "Bóng cao su đàn hồi cho chó",
      slug: "bong-cao-su-dan-hoi-cho-cho",
      description: "Bóng mềm và bền, kích thích vận động và giúp chó giảm stress.",
      price: 129000,
      stock: 80,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "do-choi-phu-kien",
      name: "Áo len ấm cho chó nhỏ",
      slug: "ao-len-am-cho-cho-nho",
      description: "Áo len dễ mặc, giữ ấm cho chó trong những ngày lạnh.",
      price: 219000,
      stock: 60,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1519415943484-2a04bdb458f0?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "do-choi-phu-kien",
      name: "Vòng cổ phản quang cho mèo",
      slug: "vong-co-phan-quang-cho-meo",
      description: "Vòng cổ có đèn phản quang, an toàn khi mèo đi ra ngoài ban đêm.",
      price: 99000,
      stock: 140,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "do-choi-phu-kien",
      name: "Chuồng gấp du lịch cho thú cưng",
      slug: "chuong-gap-du-lich-cho-thu-cung",
      description: "Chuồng di động tiện dụng dành cho thú cưng khi đi chơi hoặc khám bệnh.",
      price: 459000,
      stock: 55,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "chuong-dem-ngu",
      name: "Giường êm cho mèo",
      slug: "giuong-em-cho-meo",
      description: "Đệm mềm, giữ ấm và giúp mèo thư giãn sau ngày dài chơi đùa.",
      price: 269000,
      stock: 70,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "chuong-dem-ngu",
      name: "Chuồng sắt an toàn cho chó",
      slug: "chuong-sat-an-toan-cho-cho",
      description: "Chuồng dễ lắp ráp và vệ sinh, phù hợp cho chó vừa và nhỏ.",
      price: 659000,
      stock: 30,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "chuong-dem-ngu",
      name: "Đệm nước lạnh cho thú cưng",
      slug: "dem-nuoc-lanh-cho-thu-cung",
      description: "Đệm gel giữ mát, giảm nhiệt cho thú cưng vào mùa hè.",
      price: 319000,
      stock: 65,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "dich-vu-cham-soc",
      name: "Gói tắm spa cho chó",
      slug: "goi-tam-spa-cho-cho",
      description: "Dịch vụ tắm và chăm sóc lông mượt mà, thơm ngát cho chó cưng.",
      price: 299000,
      stock: 40,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "dich-vu-cham-soc",
      name: "Cắt tỉa lông cho mèo",
      slug: "cat-tia-long-cho-meo",
      description: "Dịch vụ cắt tỉa lông định hình, giảm rối và giữ sạch sẽ cho mèo.",
      price: 249000,
      stock: 45,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      categorySlug: "dich-vu-cham-soc",
      name: "Khám sức khoẻ thú cưng cơ bản",
      slug: "kham-suc-khoe-thu-cung-co-ban",
      description: "Gói khám tổng quát để phát hiện sớm các vấn đề về sức khỏe của thú cưng.",
      price: 199000,
      stock: 70,
      isActive: true,
      images: [
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1000&q=80",
      ],
    },
  ];

  for (const product of products) {
    const categoryId = categoryIds[product.categorySlug];
    if (!categoryId) {
      throw new Error(`Không tìm thấy category id cho slug ${product.categorySlug}`);
    }
    await upsertProduct(supabase, { ...product, categoryId });
  }

  console.log("Seed data created successfully.");
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
