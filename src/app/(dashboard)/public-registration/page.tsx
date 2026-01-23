"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedBackground } from "@/components/animated-background";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Loader2 } from "lucide-react";
import { UsernameInput } from "@/components/auth/UsernameInput";
import { BackButton } from "@/components/ui/back-button";

import { toast } from "sonner";
import { countries } from "@/lib/countries";
import { timezones } from "@/lib/timezones";

export default function PaginaRegistroPublico() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const [cargando, setCargando] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        nombreUsuario: "",
        ciudad: "",
        pais: "",
        codigoTelefono: "+51",
        numeroTelefono: "",
        zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const [usuarioVerificado, setUsuarioVerificado] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }

        if (session?.user?.name && !formData.nombre) {
            setFormData(prev => ({ ...prev, nombre: session.user.name || "" }));
        }
        const rolUsuario = session?.user?.rol;
        if (rolUsuario) {
            router.push('/home');
        }
    }, [session, router, status, formData.nombre]);



    const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "numeroTelefono") {
            const valorNumerico = value.replace(/\D/g, "");
            setFormData({ ...formData, [name]: valorNumerico });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuarioVerificado) {
            toast.error("Por favor verifica tu nombre de usuario");
            return;
        }
        setCargando(true);

        try {
            const payload = {
                correo: session?.user?.email,
                rol: 'PUBLICO',
                nombre: formData.nombre,
                nombreUsuario: formData.nombreUsuario,
                ciudad: formData.ciudad,
                pais: formData.pais,
                codigoTelefono: formData.codigoTelefono,
                numeroTelefono: formData.numeroTelefono,
                zonaHoraria: formData.zonaHoraria,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/usuarios/rol`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.email}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success("¡Registro completado con éxito!");
                if (update) await update({ rol: 'PUBLICO', name: formData.nombre });
                router.push('/home');
            } else {
                console.error('Error al registrar perfil público');
                toast.error("Error al registrar perfil público. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error('Error registrando perfil público:', error);
            toast.error("Error de conexión. Verifica tu internet.");
        } finally {
            setCargando(false);
        }
    };

    if (status === "loading") {
        return <LoadingScreen />;
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-black text-white font-sans">
            <AnimatedBackground />

            {/* Header - Increased Top Padding & Centered */}
            <div className="z-10 w-full max-w-2xl px-6 pt-32 pb-8 flex items-center justify-between">
                <BackButton href="/role-selection" />
                <h1 className="text-xl font-semibold tracking-tight">Registro de Público</h1>
                <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Main Form Container - 2 Columns on MD */}
            <div className="z-10 w-full max-w-3xl px-6 pb-20">
                <form onSubmit={manejarEnvio} className="space-y-8">

                    {/* Profile / Identity Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="nombre" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Nombre Completo</Label>
                            <Input
                                id="nombre"
                                name="nombre"
                                placeholder="Tu nombre completo"
                                required
                                value={formData.nombre}
                                onChange={manejarCambio}
                                className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm placeholder:text-zinc-600 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <UsernameInput
                                value={formData.nombreUsuario}
                                onChange={(val) => setFormData({ ...formData, nombreUsuario: val })}
                                onStatusChange={setUsuarioVerificado}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-zinc-900 w-full" />

                    {/* Contact & Location Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="telefono" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Número de celular</Label>
                            <div className="flex gap-3">
                                <Select
                                    onValueChange={(value) => setFormData({ ...formData, codigoTelefono: value })}
                                    defaultValue={formData.codigoTelefono}
                                >
                                    <SelectTrigger className="w-[110px] bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-3 text-sm">
                                        <SelectValue placeholder="+51" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-[300px]">
                                        {countries.map((c) => (
                                            <SelectItem key={c.code} value={c.phoneCode}>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative w-5 h-[15px]">
                                                        <Image
                                                            src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                                                            alt={c.name}
                                                            fill
                                                            className="object-cover rounded-sm"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <span>{c.phoneCode}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="numeroTelefono"
                                    name="numeroTelefono"
                                    placeholder="999 999 999"
                                    required
                                    value={formData.numeroTelefono}
                                    onChange={manejarCambio}
                                    className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm placeholder:text-zinc-600 flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pais" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">País</Label>
                            <Select onValueChange={(value) => setFormData({ ...formData, pais: value })}>
                                <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm">
                                    <SelectValue placeholder="Selecciona tu país" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl max-h-[300px]">
                                    {countries.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-5 h-[15px]">
                                                    <Image
                                                        src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                                                        alt={c.name}
                                                        fill
                                                        className="object-cover rounded-sm"
                                                        unoptimized
                                                    />
                                                </div>
                                                <span>{c.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ciudad" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Ciudad</Label>
                            <Input
                                id="ciudad"
                                name="ciudad"
                                placeholder="Lima"
                                required
                                value={formData.ciudad}
                                onChange={manejarCambio}
                                className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm placeholder:text-zinc-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="zonaHoraria" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Zona Horaria</Label>
                            <Select
                                onValueChange={(value) => setFormData({ ...formData, zonaHoraria: value })}
                                defaultValue={formData.zonaHoraria}
                            >
                                <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm">
                                    <SelectValue placeholder="Selecciona tu zona horaria" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-[200px]">
                                    {timezones.map((tz) => (
                                        <SelectItem key={tz} value={tz}>
                                            {tz.replace(/_/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-zinc-200 font-semibold h-11 rounded-xl text-sm shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={cargando || !usuarioVerificado}
                        >
                            {cargando ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                "Completar Registro"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
