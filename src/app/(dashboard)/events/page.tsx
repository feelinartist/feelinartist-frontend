"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/animated-background";
import { EventManager } from "@/components/dashboard/EventManager";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Radio, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ActiveEvent {
    id: string;
    titulo: string;
    [key: string]: unknown;
}

export default function EventsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const esArtista = session?.user?.rol === "ARTISTA";
    const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated" && !esArtista) {
            router.push("/home");
        }
    }, [status, session, router, esArtista]);

    if (status === "loading" || !session) {
        return <LoadingScreen />;
    }

    if (!esArtista) {
        return null;
    }

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/home" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Gestión de Eventos</h1>
                        <p className="text-zinc-400 text-sm">Administra tus eventos en vivo y la interacción con el público.</p>
                    </div>
                </div>

                <EventManager onEventChange={setActiveEvent} />

                {/* Live Requests Link - Only visible when event is active */}
                {activeEvent && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between group hover:bg-indigo-500/15 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/20 rounded-full animate-pulse">
                                    <Radio className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                                        Pedidos en Vivo
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        Gestiona las canciones que el público está pidiendo ahora mismo.
                                    </p>
                                </div>
                            </div>
                            <Link href="/events/live">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Ver Pedidos <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
