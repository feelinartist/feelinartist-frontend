"use client";

import { fetchApi } from "@/lib/api";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedBackground } from "@/components/animated-background";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { UsernameInput } from "@/components/auth/UsernameInput";
import { BackButton } from "@/components/ui/back-button";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { toast } from "sonner";
import { countries } from "@/lib/countries";
import { timezones } from "@/lib/timezones";

export default function VenueRegistrationPage() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        nombreUsuario: "",
        ciudad: "",
        pais: "",
        codigoTelefono: "+51",
        numeroTelefono: "",
        zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const [fechaFundacion, setFechaFundacion] = useState<Date | undefined>(undefined);
    const [usuarioVerificado, setUsuarioVerificado] = useState(false);
    const [calendarioAbierto, setCalendarioAbierto] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }

        if (session?.user?.name && !formData.nombre) {
            setFormData(prev => ({ ...prev, nombre: session.user.name || "" }));
        }
        const rolUsuario = session?.user?.rol;
        if (rolUsuario && rolUsuario !== 'SUPER_ADMIN' && rolUsuario !== 'ADMIN') {
            router.push('/home');
        }
    }, [session, router, status, formData.nombre]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "numeroTelefono") {
            const numericValue = value.replace(/\D/g, "");
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuarioVerificado) {
            toast.error("Por favor verifica tu nombre de usuario");
            return;
        }

        if (fechaFundacion && fechaFundacion > new Date()) {
            toast.error("La fecha de fundación no puede ser futura");
            return;
        }
        setIsLoading(true);

        try {
            const payload = {
                correo: session?.user?.email,
                rol: 'DISCOTECA',
                nombre: formData.nombre,
                nombreUsuario: formData.nombreUsuario,
                ciudadId: formData.ciudad,
                paisId: formData.pais,
                codigoTelefono: formData.codigoTelefono,
                numeroTelefono: formData.numeroTelefono,
                zonaHoraria: formData.zonaHoraria,
                fechaFundacion: fechaFundacion ? fechaFundacion.toISOString() : null,
            };

            const response = await fetchApi('/api/usuarios/rol', {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("¡Registro completado con éxito!");
                
                const esAdmin = session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN';
                if (update) {
                    await update({
                        rol: esAdmin ? session.user.rol : (data.rol?.nombre || 'DISCOTECA'),
                        name: formData.nombre,
                        accessToken: data.token
                    });
                }
                window.location.replace(esAdmin ? '/settings' : '/home');
            } else {
                console.error('Failed to register venue');
                toast.error("Error al registrar discoteca. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error('Error registering venue:', error);
            toast.error("Error de conexión. Verifica tu internet.");
        } finally {
            setIsLoading(false);
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
                <BackButton href={session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN' ? "/settings" : "/role-selection"} />
                <h1 className="text-xl font-semibold tracking-tight">Registro de Discoteca</h1>
                <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Main Form Container - 2 Columns on MD */}
            <div className="z-10 w-full max-w-3xl px-6 pb-20">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Profile / Identity Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="nombre" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Nombre de la Discoteca</Label>
                            <Input
                                id="nombre"
                                name="nombre"
                                placeholder="Nombre del local"
                                required
                                value={formData.nombre}
                                onChange={handleChange}
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

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Fecha de Fundación</Label>
                            <Popover open={calendarioAbierto} onOpenChange={setCalendarioAbierto}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:text-white h-11 rounded-xl px-4 text-sm",
                                            !fechaFundacion && "text-zinc-600"
                                        )}
                                    >
                                        <CalendarIcon className="mr-3 h-4 w-4 opacity-50" />
                                        {fechaFundacion ? format(fechaFundacion, "PPP", { locale: es }) : <span>¿Cuándo se fundó?</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800 text-white rounded-xl shadow-2xl overflow-hidden" align="center">
                                    <Calendar
                                        mode="single"
                                        selected={fechaFundacion}
                                        onSelect={(date) => {
                                            setFechaFundacion(date);
                                            setCalendarioAbierto(false);
                                        }}
                                        disabled={(date) => date > new Date()}
                                        className="p-4"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-900 w-full" />

                    {/* Contact & Location Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="numeroTelefono" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Número de celular</Label>
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
                                    onChange={handleChange}
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
                                onChange={handleChange}
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
                            disabled={isLoading || !usuarioVerificado}
                        >
                            {isLoading ? (
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
