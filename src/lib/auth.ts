import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export function getAuthOptions(): NextAuthOptions {
    // Valores directos de variables de entorno (.env.local)
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    if (!googleClientId || !googleClientSecret) {
        console.warn('⚠️ Faltan credenciales de Google en .env.local');
    }

    return {
        // secret: process.env.NEXTAUTH_SECRET, // Implícito
        providers: [
            GoogleProvider({
                clientId: googleClientId,
                clientSecret: googleClientSecret,
                authorization: {
                    params: {
                        prompt: "select_account",
                        access_type: "offline",
                        response_type: "code"
                    }
                }
            }),
        ],
        session: {
            strategy: "jwt",
        },
        pages: {
            signIn: "/login",
        },
        callbacks: {
            async jwt({ token, user, account, trigger, session }) {
                if (trigger === "update" && session) {
                    // Allow updating role and other properties from the client
                    if (session.rol) token.rol = session.rol;
                    if (session.nombreArtistico) token.nombreArtistico = session.nombreArtistico;
                    if (session.name) token.name = session.name;
                    if (session.image) token.image = session.image;
                    if (session.accessToken) token.accessToken = session.accessToken;
                    if (session.perfilCompletadoReconocido !== undefined) token.perfilCompletadoReconocido = session.perfilCompletadoReconocido;
                }

                if (account && user) {
                    try {
                        const response = await fetch(`${backendUrl}/api/auth/login`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                correo: user.email,
                                nombre: user.name,
                                imagen: user.image
                            }),
                        });

                        if (response.ok) {
                            const dbUser = await response.json();
                            token.id = dbUser.id;
                            token.rol = dbUser.rol?.nombre;
                            token.name = dbUser.nombre || user.name;
                            token.image = dbUser.imagen || user.image;
                            token.perfilCompletadoReconocido = dbUser.perfilCompletadoReconocido || false;
                            // Store the real backend JWT for API calls
                            token.accessToken = dbUser.token;
                        } else {
                            console.error("Failed to sync user with backend. Status:", response.status);
                            throw new Error("Failed to authenticate with backend");
                        }
                    } catch (error) {
                        console.error("Error syncing user with backend:", error);
                        throw new Error("Backend synchronization failed");
                    }
                }
                return token;
            },
            async session({ session, token }) {
                if (session.user) {
                    session.user.id = token.id as string;
                    session.user.rol = token.rol as string;
                    session.user.name = token.name as string;
                    session.user.image = token.image as string;
                    session.user.perfilCompletadoReconocido = token.perfilCompletadoReconocido as boolean;
                }
                // Expose the backend JWT to the client for API calls
                session.accessToken = token.accessToken as string;
                return session;
            },
        },
    };
}
