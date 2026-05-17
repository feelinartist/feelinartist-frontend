"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AnimatedBackground } from "@/components/animated-background";
import { LiveRequestsFeed } from "@/components/dashboard/LiveRequestsFeed";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

interface ActiveEvent {
    id: string;
    titulo: string;
    [key: string]: unknown;
}

export default function LiveRequestsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchActiveEvent = useCallback(async () => {
        try {
            const artistaId = session?.user?.id;
            if (!artistaId) return;

            const res = await fetchApi(`/api/eventos/activo/${artistaId}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setActiveEvent(data);
                } else {
                    toast.error("No hay evento activo");
                    router.push("/events");
                }
            } else {
                console.error("Error fetching active event");
                router.push("/events");
            }
        } catch (error) {
            console.error("Error fetching event:", error);
            router.push("/events");
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, router]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session?.user?.rol !== "ARTISTA") {
                router.push("/home");
                return;
            }
            fetchActiveEvent();
        }
    }, [status, session?.user?.rol, router, fetchActiveEvent]);

    if (status === "loading" || loading) {
        return <LoadingScreen />;
    }

    if (!activeEvent) return null;

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/events" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            Pedidos en Vivo
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            {activeEvent.titulo}
                        </p>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Re-using the feed component */}
                    <LiveRequestsFeed eventoId={activeEvent.id} />
                </div>
            </div>
        </div>
    );
}
