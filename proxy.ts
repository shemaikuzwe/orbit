import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const onSignIn = request.nextUrl.pathname === "/sign-in";
  if (!session && !onSignIn)
    return NextResponse.redirect(new URL("/sign-in", request.url));
  if (session && onSignIn)
    return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sign-in"],
};
