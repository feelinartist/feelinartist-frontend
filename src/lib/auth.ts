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
                        prompt: "consent select_account",
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
                    if (session.perfilCompletadoReconocido !== undefined) token.perfilCompletadoReconocido = session.perfilCompletadoReconocido;
                }

                if (account && user) {
                    try {
                        console.log("Syncing user with backend at:", backendUrl);

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

                        console.log("Backend response status:", response.status);

                        if (response.ok) {
                            const dbUser = await response.json();
                            console.log("Backend user data:", JSON.stringify(dbUser, null, 2));
                            token.id = dbUser.id;
                            token.rol = dbUser.rol?.nombre;
                            token.name = dbUser.nombre || user.name;
                            token.image = dbUser.imagen || user.image;
                            token.perfilCompletadoReconocido = dbUser.perfilCompletadoReconocido || false;
                        } else {
                            console.error("Failed to sync user with backend. Status:", response.status);
                            const errorText = await response.text();
                            console.error("Error details:", errorText);
                        }
                    } catch (error) {
                        console.error("Error syncing user with backend:", error);
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
                return session;
            },
        },
    };
}
