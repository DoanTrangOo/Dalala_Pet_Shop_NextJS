import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/cart", "/checkout", "/profile"];
const ADMIN_PREFIX = "/admin";

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  path: string
) {
  const redirectUrl = new URL(path, request.url);
  const redirectResponse = NextResponse.redirect(redirectUrl);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!user) {
      return redirectWithCookies(request, response, "/");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || data?.role !== "admin") {
      return redirectWithCookies(request, response, "/");
    }
  }

  if (isProtectedPath(pathname) && !user) {
    return redirectWithCookies(request, response, "/login");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
