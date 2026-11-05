import { auth } from "@/src/lib/auth/server";

// Optimistic session check only; roles are enforced in each page via requireAdmin/requireSupporter.
export default auth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tickets/:path*",
    "/stats/:path*",
    "/admin/:path*",
    "/support/:path*",
  ],
};
