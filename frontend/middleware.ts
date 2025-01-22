import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname === "/";
    const isAdmin = token?.role === "Admin";
    const isUsersPage = req.nextUrl.pathname.startsWith("/users");

    // Prevent infinite redirects
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Allow access to auth page
    if (isAuthPage) {
      return null;
    }

    // Require authentication for all other pages
    if (!isAuth) {
      const from = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(new URL(`/?from=${from}`, req.url));
    }

    // Restrict users page to admin only
    if (isUsersPage && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // Let the middleware function handle the auth check
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: ["/", "/dashboard/:path*", "/users/:path*"],
};
