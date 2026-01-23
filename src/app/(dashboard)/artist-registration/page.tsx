"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedBackground } from "@/components/animated-background";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { UsernameInput } from "@/components/auth/UsernameInput";
import { BackButton } from "@/components/ui/back-button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { toast } from "sonner";
import { countries } from "@/lib/countries";
import { timezones } from "@/lib/timezones";

export default function ArtistRegistrationPage() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombreArtistico: "",
        nombreUsuario: "",
        categoria: "",
        biografia: "",
        ciudad: "",
        pais: "",
        codigoTelefono: "+51",
        numeroTelefono: "",
        tarifaPorHora: "",
        moneda: "PEN",
        zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
    const [lugaresConocidos, setLugaresConocidos] = useState<string[]>([]);
    const [nuevoLugar, setNuevoLugar] = useState("");
    const [usuarioVerificado, setUsuarioVerificado] = useState(false);
    const [calendarioAbierto, setCalendarioAbierto] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }

        if (session?.user?.name && !formData.nombreArtistico) {
            setFormData(prev => ({ ...prev, nombreArtistico: session.user.name || "" }));
        }
        const rolUsuario = session?.user?.rol;
        if (rolUsuario) {
            router.push('/home');
        }
    }, [session, router, status, formData.nombreArtistico]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "numeroTelefono") {
            const numericValue = value.replace(/\D/g, "");
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleCategoryChange = (value: string) => {
        setFormData({ ...formData, categoria: value });
    };

    const handleCurrencyChange = (value: string) => {
        setFormData({ ...formData, moneda: value });
    };

    const agregarLugar = () => {
        if (nuevoLugar.trim()) {
            setLugaresConocidos([...lugaresConocidos, nuevoLugar.trim()]);
            setNuevoLugar("");
        }
    };

    const removerLugar = (index: number) => {
        setLugaresConocidos(lugaresConocidos.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuarioVerificado) {
            toast.error("Por favor verifica tu nombre de usuario");
            return;
        }

        if (fechaInicio && fechaInicio > new Date()) {
            toast.error("La fecha de inicio no puede ser futura");
            return;
        }
        setIsLoading(true);

        try {
            const payload = {
                correo: session?.user?.email,
                rol: 'ARTISTA',
                nombreArtistico: formData.nombreArtistico,
                nombreUsuario: formData.nombreUsuario,
                categoria: formData.categoria,
                biografia: formData.biografia,
                ciudadId: formData.ciudad,
                paisId: formData.pais,
                codigoTelefono: formData.codigoTelefono,
                numeroTelefono: formData.numeroTelefono,
                fechaInicio: fechaInicio ? fechaInicio.toISOString() : null,
                tarifaPorHora: parseFloat(formData.tarifaPorHora) || 0,
                moneda: formData.moneda,
                zonaHoraria: formData.zonaHoraria,
                lugaresConocidos: lugaresConocidos
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
                if (update) await update({ rol: 'ARTISTA', nombreArtistico: formData.nombreArtistico, name: formData.nombreArtistico });
                router.push('/home');
            } else {
                console.error('Failed to register artist');
                toast.error("Error al registrar artista. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error('Error registering artist:', error);
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
                <BackButton href="/role-selection" />
                <h1 className="text-xl font-semibold tracking-tight">Registro de Artista</h1>
                <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Main Form Container - 2 Columns on MD */}
            <div className="z-10 w-full max-w-3xl px-6 pb-20">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Profile / Identity Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="nombreArtistico" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Nombre Artístico</Label>
                            <Input
                                id="nombreArtistico"
                                name="nombreArtistico"
                                placeholder="Tu nombre de artista"
                                required
                                value={formData.nombreArtistico}
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

                        <div className="space-y-1.5">
                            <Label htmlFor="categoria" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Categoría</Label>
                            <Select onValueChange={handleCategoryChange} required>
                                <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm flex items-center justify-between">
                                    <SelectValue placeholder="Selecciona tu categoría" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                    <SelectItem value="DJ">DJ</SelectItem>
                                    <SelectItem value="BANDA">Banda</SelectItem>
                                    <SelectItem value="SOLISTA">Solista</SelectItem>
                                    <SelectItem value="ORQUESTA">Orquesta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Inicio de Carrera</Label>
                            <Popover open={calendarioAbierto} onOpenChange={setCalendarioAbierto}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:text-white h-11 rounded-xl px-4 text-sm",
                                            !fechaInicio && "text-zinc-600"
                                        )}
                                    >
                                        <CalendarIcon className="mr-3 h-4 w-4 opacity-50" />
                                        {fechaInicio ? format(fechaInicio, "PPP", { locale: es }) : <span>¿Cuándo empezaste?</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800 text-white rounded-xl shadow-2xl overflow-hidden" align="center">
                                    <Calendar
                                        mode="single"
                                        selected={fechaInicio}
                                        onSelect={(date) => {
                                            setFechaInicio(date);
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

                    {/* Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="tarifaPorHora" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Tarifa por Hora</Label>
                            <div className="flex gap-3">
                                <Select onValueChange={handleCurrencyChange} defaultValue={formData.moneda}>
                                    <SelectTrigger className="w-[100px] bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-3 text-sm">
                                        <SelectValue placeholder="PEN" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                        <SelectItem value="PEN">PEN</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="MXN">MXN</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="tarifaPorHora"
                                    name="tarifaPorHora"
                                    type="number"
                                    placeholder="0.00"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.tarifaPorHora}
                                    onChange={handleChange}
                                    className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm placeholder:text-zinc-600 flex-1"
                                />
                            </div>
                        </div>

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
                                                    <Image src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} alt={c.name} width={20} height={15} className="w-5 h-auto object-cover rounded-sm" unoptimized />
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
                                                <Image src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} alt={c.name} width={20} height={15} className="w-5 h-auto object-cover rounded-sm" unoptimized />
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
                        <div className="space-y-1.5 md:col-span-2">
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

                    <div className="h-px bg-zinc-900 w-full" />

                    {/* Bio & Venues */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="biografia" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Biografía</Label>
                            <Textarea
                                id="biografia"
                                name="biografia"
                                placeholder="Cuéntanos un poco sobre ti..."
                                value={formData.biografia}
                                onChange={handleChange}
                                spellCheck={true}
                                lang="es"
                                className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white min-h-[120px] rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 resize-none relative z-20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Lugares donde te has presentado</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Agregar lugar..."
                                    value={nuevoLugar}
                                    onChange={(e) => setNuevoLugar(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            agregarLugar();
                                        }
                                    }}
                                    className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm placeholder:text-zinc-600"
                                />
                                <Button type="button" onClick={agregarLugar} variant="secondary" className="h-11 w-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white p-0 flex items-center justify-center shrink-0">
                                    <span className="text-xl">+</span>
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {lugaresConocidos.map((lugar, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full text-sm">
                                        <span>{lugar}</span>
                                        <button type="button" onClick={() => removerLugar(index)} className="hover:text-white cursor-pointer ml-1 opacity-60 hover:opacity-100">
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
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
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
