import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isRolePage = req.nextUrl.pathname.startsWith("/role-selection");
    const isRegistrationPage =
        req.nextUrl.pathname.startsWith("/artist-registration") ||
        req.nextUrl.pathname.startsWith("/public-registration") ||
        req.nextUrl.pathname.startsWith("/venue-registration");
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");

    if (isAuth) {
        // If user has a role, they shouldn't be on role selection or registration pages
        if (token.rol) {
            if (isRolePage || isRegistrationPage) {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
        }
        // If user has NO role, they MUST NOT be on the dashboard
        else {
            if (isDashboardPage) {
                return NextResponse.redirect(new URL("/role-selection", req.url));
            }
        }
    } else {
        if (isRolePage || isRegistrationPage || isDashboardPage) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard",
        "/dashboard/:path*",
        "/role-selection/:path*",
        "/artist-registration/:path*",
        "/public-registration/:path*",
        "/venue-registration/:path*",
    ],
};
