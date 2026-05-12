import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export default proxy;
export { proxy };

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo-xepelin.png).*)"],
};