"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, CheckCircle, XCircle, TrendingUp, Award } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

interface EstadisticasEvento {
    totalPedidos: number;
    totalAceptados: number;
    totalRechazados: number;
    tasaAceptacion: number;
    generosPorConteo: Array<{ genero: string; conteo: number; porcentaje: number }>;
    topCanciones: Array<{
        titulo: string;
        artista: string;
        genero: string;
        total: number;
        aceptados: number;
        rechazados: number;
    }>;
    topAceptadas: Array<{
        titulo: string;
        artista: string;
        total: number;
    }>;
    topRechazadas: Array<{
        titulo: string;
        artista: string;
        total: number;
    }>;
    evento?: {
        titulo: string;
        horaInicio: Date;
    };
}

export default function EventStatsPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const eventoId = params?.eventoId as string;
    const [estadisticas, setEstadisticas] = useState<EstadisticasEvento | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargarEstadisticas = useCallback(async () => {
        try {
            setCargando(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/estadisticas/evento/${eventoId}`);
            if (!res.ok) throw new Error("Error al cargar estadísticas");

            const data = await res.json();
            setEstadisticas(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setCargando(false);
        }
    }, [eventoId]);

    useEffect(() => {
        if (session?.user && eventoId) {
            cargarEstadisticas();
        }
    }, [session?.user?.id, eventoId, cargarEstadisticas]);

    if (cargando) return <LoadingScreen />;
    if (!estadisticas) return null;

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header with Breadcrumb */}
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/stats/events" />
                    <div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                            <span className="cursor-pointer hover:text-white" onClick={() => router.push('/stats')}>Estadísticas</span>
                            <span>›</span>
                            <span className="cursor-pointer hover:text-white" onClick={() => router.push('/stats/events')}>Eventos</span>
                            <span>›</span>
                            <span className="text-white">{estadisticas.evento?.titulo || 'Evento'}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{estadisticas.evento?.titulo}</h1>
                        <p className="text-zinc-400 text-sm">
                            {estadisticas.evento?.horaInicio && new Date(estadisticas.evento.horaInicio).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Métricas Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    <Card className="bg-zinc-900/40 border-white/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm">Total Pedidos</p>
                                    <p className="text-3xl font-bold mt-1">{estadisticas.totalPedidos}</p>
                                </div>
                                <Music className="h-10 w-10 text-indigo-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm">Aceptados</p>
                                    <p className="text-3xl font-bold mt-1 text-green-500">{estadisticas.totalAceptados}</p>
                                </div>
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm">Rechazados</p>
                                    <p className="text-3xl font-bold mt-1 text-red-500">{estadisticas.totalRechazados}</p>
                                </div>
                                <XCircle className="h-10 w-10 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm">Tasa Aceptación</p>
                                    <p className="text-3xl font-bold mt-1 text-indigo-500">{estadisticas.tasaAceptacion}%</p>
                                </div>
                                <TrendingUp className="h-10 w-10 text-indigo-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Gráficos y Tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Géneros */}
                    <Card className="bg-zinc-900/40 border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Award className="w-5 h-5 text-pink-500" />
                                Géneros Más Pedidos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {estadisticas.generosPorConteo.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={estadisticas.generosPorConteo}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="conteo"
                                        >
                                            {estadisticas.generosPorConteo.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-500">
                                    No hay datos de géneros disponibles
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs de Canciones */}
                    <Card className="bg-zinc-900/40 border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white">Análisis de Canciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="pedidas" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                                    <TabsTrigger value="pedidas">🎵 Más Pedidas</TabsTrigger>
                                    <TabsTrigger value="aceptadas">✅ Aceptadas</TabsTrigger>
                                    <TabsTrigger value="rechazadas">❌ Rechazadas</TabsTrigger>
                                </TabsList>

                                <TabsContent value="pedidas" className="mt-4">
                                    <div className="space-y-2">
                                        {estadisticas.topCanciones.slice(0, 10).map((cancion, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-zinc-500 font-mono w-6 text-center">{i + 1}</span>
                                                    <div>
                                                        <p className="font-medium text-white">{cancion.titulo}</p>
                                                        <p className="text-xs text-zinc-400">{cancion.artista}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-indigo-400 font-bold">{cancion.total}</span>
                                                    <div className="flex gap-2 text-[10px] text-zinc-500 mt-1">
                                                        <span className="text-green-500/70">✔ {cancion.aceptados}</span>
                                                        <span className="text-red-500/70">✖ {cancion.rechazados}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {estadisticas.topCanciones.length === 0 && (
                                            <div className="text-center py-8 text-zinc-500">No hay datos disponibles</div>
                                        )}

                                        <div className="pt-4 flex justify-center">
                                            <Button
                                                variant="outline"
                                                className="w-full border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                                onClick={() => router.push(`/stats/events/${eventoId}/songs`)}
                                            >
                                                Ver reporte completo →
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="aceptadas" className="mt-4">
                                    <div className="space-y-2">
                                        {estadisticas.topAceptadas?.slice(0, 10).map((cancion, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-zinc-500 font-mono w-6 text-center">{i + 1}</span>
                                                    <div>
                                                        <p className="font-medium text-white">{cancion.titulo}</p>
                                                        <p className="text-xs text-zinc-400">{cancion.artista}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-green-500 font-bold">{cancion.total}</span>
                                                    <p className="text-[10px] text-zinc-500">Aceptados</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!estadisticas.topAceptadas || estadisticas.topAceptadas.length === 0) && (
                                            <div className="text-center py-8 text-zinc-500">No hay datos disponibles</div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="rechazadas" className="mt-4">
                                    <div className="space-y-2">
                                        {estadisticas.topRechazadas?.slice(0, 10).map((cancion, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-zinc-500 font-mono w-6 text-center">{i + 1}</span>
                                                    <div>
                                                        <p className="font-medium text-white">{cancion.titulo}</p>
                                                        <p className="text-xs text-zinc-400">{cancion.artista}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-red-500 font-bold">{cancion.total}</span>
                                                    <p className="text-[10px] text-zinc-500">Rechazados</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!estadisticas.topRechazadas || estadisticas.topRechazadas.length === 0) && (
                                            <div className="text-center py-8 text-zinc-500">No hay datos disponibles</div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
