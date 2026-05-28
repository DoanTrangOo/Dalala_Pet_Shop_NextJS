"use server";

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

  // Return a client-side redirect instruction instead of performing a server redirect.
  return { redirectTo: "/" };
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

export async function logoutAction(): Promise<AuthActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }

  return { redirectTo: "/" };
}

export async function changePasswordAction(
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 8) {
    return { error: "Mật khẩu phải có ít nhất 8 ký tự." };
  }

  if (password !== confirmPassword) {
    return { error: "Mật khẩu xác nhận không khớp." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Bạn cần đăng nhập để đổi mật khẩu." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  return { success: "Đổi mật khẩu thành công." };
}
