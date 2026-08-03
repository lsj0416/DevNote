import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PATHS = ["/analysis", "/notes", "/profile"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/analysis/:path*", "/notes/:path*", "/profile/:path*"],
  runtime: "nodejs",
};
