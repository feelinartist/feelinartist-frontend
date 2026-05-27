import { getSession, signOut } from "next-auth/react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

/**
 * Authenticated fetch wrapper that automatically includes the backend JWT
 * from the NextAuth session in the Authorization header.
 *
 * Usage:
 *   const res = await fetchApi("/api/usuarios/perfil", { method: "PATCH", body: JSON.stringify(data) });
 */
export async function fetchApi(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const session = await getSession();
    const accessToken = session?.accessToken;

    const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(options.headers || {}),
        },
    });

    if ((response.status === 401 || response.status === 403) && typeof window !== "undefined") {
        void signOut({ callbackUrl: "/login" });
    }

    return response;
}
