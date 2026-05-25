"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  loginSchema,
  registerSchema,
  type LoginValues,
  type RegisterValues,
} from "./schemas";

type AuthActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
};

export async function loginAction(
  values: LoginValues
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login data." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("email not confirmed")) {
      return { error: "Vui lòng xác thực email trước khi đăng nhập." };
    }
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  redirect("/");
}

export async function registerAction(
  values: RegisterValues
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid registration data.",
    };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("user already registered")) {
      return { error: "Email đã được đăng ký." };
    }
    return { error: error.message };
  }

  if (data.session) {
    return { redirectTo: "/" };
  }

  return {
    success: "Account created. Please check your email to confirm.",
  };
}
