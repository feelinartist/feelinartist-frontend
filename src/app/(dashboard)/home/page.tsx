"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";

import { Button } from "@/components/ui/button";




import { LoadingScreen } from "@/components/ui/loading-screen";


import { toast } from "sonner";

import { ProfileCompletionChecklist } from "@/components/ProfileCompletionChecklist";
import { ArtistDiscovery } from "@/components/dashboard/ArtistDiscovery";



interface ArtistProfile {
    id: string;
    biografia?: string;
    categoria?: string;
    galeria?: { urlImagen: string }[];
    redesSociales?: { plataforma: string, url: string }[];
    metodosDonacion?: unknown[];
    [key: string]: unknown;
}

export default function PaginaPanelControl() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [perfilArtista, setPerfilArtista] = useState<ArtistProfile | null>(null);
    const [checklistDismissed, setChecklistDismissed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem('checklist-dismissed') === 'true';
        }
        return false;
    });
    const [reconocido, setReconocido] = useState(false);
    const esArtista = session?.user?.rol === "ARTISTA";

    const handleDismissChecklist = () => {
        setChecklistDismissed(true);
        localStorage.setItem('checklist-dismissed', 'true');
    };

    const handleRestoreChecklist = () => {
        setChecklistDismissed(false);
        localStorage.setItem('checklist-dismissed', 'false');
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated" && !session?.user?.rol) {
            router.push("/role-selection");
        }
    }, [status, session?.user?.rol, router]);

    const cargarPerfilArtista = useCallback(async (mounted: boolean) => {
        try {
            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/usuarios/perfil/${session?.user?.id}`;
            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                if (mounted) {
                    setPerfilArtista(data.perfilArtista || {});
                    setReconocido(!!data.perfilCompletadoReconocido);
                }

                // Check for active event (only once per session)
                if (!sessionStorage.getItem('eventRedirectChecked')) {
                    const resEvent = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/eventos/activo/${data.perfilArtista?.id}`);
                    if (resEvent.ok) {
                        const eventData = await resEvent.json();
                        if (eventData) {
                            toast.info("Retomando tu evento activo...");
                            sessionStorage.setItem('eventRedirectChecked', 'true');
                            router.push("/events/live");
                            return;
                        }
                    }
                    sessionStorage.setItem('eventRedirectChecked', 'true');
                }
            } else {
                const errorText = await res.text();
                console.error("Error response:", errorText);
            }
        } catch (error) {
            console.error("Error cargando perfil de artista:", error);
        }
    }, [session, router]); // Dependency changed from session?.user?.id to session to satisfy compiler

    useEffect(() => {
        let mounted = true;

        if (esArtista && session?.user?.id) {
            // Schedule the call to avoid synchronous setState in effect body
            const timer = setTimeout(() => {
                if (mounted) {
                    void cargarPerfilArtista(mounted);
                }
            }, 0);
            return () => {
                mounted = false;
                clearTimeout(timer);
            };
        }

        return () => { mounted = false; };
    }, [esArtista, session?.user?.id, cargarPerfilArtista]);

    const cargandoPerfil = esArtista && status === "authenticated" && !perfilArtista;



    // Check if profile is complete
    const isProfileComplete = useCallback(() => {
        if (!perfilArtista) return false;

        const hasBasicInfo = !!(perfilArtista.biografia && perfilArtista.categoria);
        const hasGallery = !!(perfilArtista.galeria && perfilArtista.galeria.length > 0);
        const hasSocial = !!(perfilArtista.redesSociales && perfilArtista.redesSociales.length > 0);
        const hasDonation = !!(perfilArtista.metodosDonacion && perfilArtista.metodosDonacion.length > 0);

        return hasBasicInfo && hasGallery && hasSocial && hasDonation;
    }, [perfilArtista]);

    // Automatically reset acknowledgment if profile becomes incomplete
    useEffect(() => {
        if (esArtista && perfilArtista && reconocido && !isProfileComplete()) {
            console.log("Perfil incompleto detectado, reseteando reconocimiento...");
            const resetAcknowledgment = async () => {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/usuarios/marcar-perfil-completado`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            usuarioId: session?.user?.id,
                            perfilCompletadoReconocido: false
                        })
                    });
                    // Use functional update to avoid synchronous dependency issues
                    setReconocido(prev => {
                        if (prev === true) return false;
                        return prev;
                    });
                } catch (error) {
                    console.error("Error resetting profile acknowledgment:", error);
                }
            };
            void resetAcknowledgment();
        }
    }, [perfilArtista, reconocido, esArtista, session?.user?.id, isProfileComplete]);

    // Show checklist if: profile is incomplete OR (profile is complete but not yet acknowledged)
    // Using fresh 'reconocido' state instead of session for immediate updates
    const shouldShowChecklist = !checklistDismissed && (!isProfileComplete() || !reconocido);

    if (status === "loading" || (esArtista && cargandoPerfil)) {
        return <LoadingScreen />;
    }

    if (!session || !session.user?.rol) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 tracking-tight">
                    Bienvenido, {session.user.name}
                </h1>

                <div className="space-y-4">


                    {/* Profile Completion Checklist - Only for Artists - Full Width */}
                    {esArtista && perfilArtista && shouldShowChecklist && (
                        <ProfileCompletionChecklist
                            perfilArtista={perfilArtista}
                            onDismiss={handleDismissChecklist}
                        />
                    )}

                    {/* Restore checklist button - only show if not acknowledged or incomplete */}
                    {esArtista && checklistDismissed && (!isProfileComplete() || !reconocido) && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={handleRestoreChecklist}
                                className="border-white/10 bg-black/20 text-zinc-400 hover:text-white hover:bg-white/10 text-xs h-8"
                            >
                                Mostrar sugerencias de perfil
                            </Button>
                        </div>
                    )}

                    {/* Main content area */}
                    <div className="bg-zinc-900/10 border border-white/5 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
                        <ArtistDiscovery />
                    </div>
                </div>
            </div >
        </div >
    );
}
