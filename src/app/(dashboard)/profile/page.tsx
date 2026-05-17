"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";
import { Loader2, Save, Trash2, Plus, User, Music, Building2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { UsernameInput } from "@/components/auth/UsernameInput";
import { countries } from "@/lib/countries";
import { timezones } from "@/lib/timezones";
import { CountryPhoneSelector } from "@/components/ui/country-phone-selector";
import { GalleryForm } from "@/components/profile/GalleryForm";
import { SocialMediaForm } from "@/components/profile/SocialMediaForm";
import { DonationForm } from "@/components/profile/DonationForm";
import { ArtistProfileForm } from "@/components/profile/ArtistProfileForm";
import { VenueProfileForm } from "@/components/profile/VenueProfileForm";


import { fetchApi } from "@/lib/api";

interface UserProfile {
    nombre?: string;
    correo: string;
    nombreUsuario: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    perfilArtista?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    perfilPublico?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    perfilDiscoteca?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export default function PaginaPerfil() {
    const { data: session, update } = useSession();
    const searchParams = useSearchParams();
    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(true);
    const [perfilCompleto, setPerfilCompleto] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'personal');
    const [formData, setFormData] = useState({
        nombre: "",
        correo: "",
        nombreArtistico: "",
        nombreUsuario: "",
        pais: "",
        ciudad: "",
        zonaHoraria: "",
        telefono: "",
        codigoTelefono: "+51",
    });

    // Estados para verificado del usuario (gestionado por UsernameInput)
    const [usuarioVerificado, setUsuarioVerificado] = useState(true);

    const normalize = (text: string) =>
        text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const sessionUserId = session?.user?.id;
    const sessionUserRol = session?.user?.rol;

    const esAdmin = sessionUserRol === 'ADMIN' || sessionUserRol === 'SUPER_ADMIN';
    const [viewAsRole, setViewAsRole] = useState<'ARTISTA' | 'DISCOTECA' | 'PUBLICO' | null>(null);

    const esArtista = viewAsRole === 'ARTISTA';
    const esDiscoteca = viewAsRole === 'DISCOTECA';

    useEffect(() => {
        if (perfilCompleto) {
            if (esAdmin) {
                if (viewAsRole === null) {
                    if (perfilCompleto.perfilArtista) setViewAsRole('ARTISTA');
                    else if (perfilCompleto.perfilDiscoteca) setViewAsRole('DISCOTECA');
                    else setViewAsRole('PUBLICO');
                }
            } else {
                if (sessionUserRol === 'ARTISTA') setViewAsRole('ARTISTA');
                else if (sessionUserRol === 'DISCOTECA') setViewAsRole('DISCOTECA');
                else setViewAsRole('PUBLICO');
            }
        }
    }, [perfilCompleto, esAdmin, sessionUserRol, viewAsRole]);

    const cargarPerfil = useCallback(async () => {
        if (!sessionUserId) return;
        try {
            const res = await fetchApi(`/api/usuarios/perfil/${sessionUserId}`);
            if (res.ok) {
                const data = await res.json();

                // Save complete profile for tabs
                setPerfilCompleto(data);

                // Extract profile specific data
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let perfilData: Record<string, any> = {};
                if (data.perfilArtista) perfilData = data.perfilArtista;
                else if (data.perfilPublico) perfilData = data.perfilPublico;
                else if (data.perfilDiscoteca) perfilData = data.perfilDiscoteca;

                setFormData({
                    nombre: data.nombre || "",
                    correo: data.correo || "",
                    nombreArtistico: data.perfilArtista?.nombreArtistico || "",
                    nombreUsuario: data.nombreUsuario || "",
                    pais: (() => {
                        const paisGuardado = perfilData.pais;
                        if (!paisGuardado) return "";

                        // Try to find exact code match
                        const exactMatch = countries.find(c => c.code === paisGuardado);
                        if (exactMatch) return exactMatch.code;

                        // Try to find name match (case and accent insensitive)
                        const nameMatch = countries.find(c => normalize(c.name) === normalize(paisGuardado));
                        if (nameMatch) return nameMatch.code;

                        return "";
                    })(),
                    ciudad: perfilData.ciudad || "",
                    zonaHoraria: perfilData.zonaHoraria || "",
                    telefono: perfilData.numeroTelefono || "",
                    codigoTelefono: perfilData.codigoTelefono || "",
                });
            }
        } catch (error) {
            console.error("Error cargando perfil:", error);
            toast.error("Error al cargar datos del perfil");
        } finally {
            setCargandoDatos(false);
        }
    }, [sessionUserId]);

    useEffect(() => {
        if (sessionUserId) {
            cargarPerfil();
        }
    }, [sessionUserId, cargarPerfil]);

    const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!usuarioVerificado) {
            toast.error("Por favor verifica tu nombre de usuario");
            return;
        }

        setCargando(true);

        try {
            const response = await fetchApi('/api/usuarios/perfil', {
                method: 'PATCH',
                body: JSON.stringify({
                    usuarioId: session?.user?.id,
                    nombre: formData.nombre,
                    nombreUsuario: formData.nombreUsuario,
                    pais: formData.pais,
                    ciudad: formData.ciudad,
                    zonaHoraria: formData.zonaHoraria,
                    telefono: formData.telefono,
                    codigoTelefono: formData.codigoTelefono,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error al actualizar perfil");
            }

            // Actualizar sesión
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: formData.nombre,
                    nombreUsuario: formData.nombreUsuario,
                }
            });

            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            toast.error((error as Error).message || "Error al actualizar el perfil");
        } finally {
            setCargando(false);
        }
    };

    const handleCreateProfile = async (type: 'artista' | 'discoteca' | 'publico') => {
        setCargando(true);
        try {
            const body: Record<string, unknown> = { usuarioId: session?.user?.id };
            if (type === 'artista') {
                body.perfilArtista = {
                    categoria: 'SOLISTA',
                    biografia: '',
                    zonaHoraria: 'America/Lima',
                    pais: 'PE',
                    ciudad: 'Lima'
                };
            } else if (type === 'discoteca') {
                body.perfilDiscoteca = {
                    zonaHoraria: 'America/Lima',
                    pais: 'PE',
                    ciudad: 'Lima'
                };
            } else if (type === 'publico') {
                body.perfilPublico = {
                    zonaHoraria: 'America/Lima',
                    pais: 'PE',
                    ciudad: 'Lima'
                };
            }

            const res = await fetchApi('/api/usuarios/perfil', {
                method: 'PATCH',
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(`Perfil de ${type} creado exitosamente`);
                await cargarPerfil();
            } else {
                toast.error("Error al crear el perfil");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al conectar con el servidor");
        } finally {
            setCargando(false);
        }
    };

    const handleDeleteProfile = async (type: 'artista' | 'discoteca' | 'publico') => {
        if (!confirm(`¿Estás seguro de que deseas eliminar tu perfil de ${type}? Se perderán todos los datos relacionados, pero tu cuenta de administrador permanecerá activa.`)) {
            return;
        }

        setCargando(true);
        try {
            const res = await fetchApi(`/api/admin/usuarios/perfil/${type}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success(`Perfil de ${type} eliminado correctamente`);
                await cargarPerfil();
            } else {
                const err = await res.json();
                toast.error(err.message || "Error al eliminar el perfil");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión al eliminar el perfil");
        } finally {
            setCargando(false);
        }
    };

    if (cargandoDatos) {
        return <LoadingScreen />;
    }

    const showArtistTabs = esArtista && perfilCompleto?.perfilArtista;

    const noProfilePlaceholder = (type: 'artista' | 'discoteca' | 'publico', label: string) => (
        <div className="p-8 text-center space-y-6">
            <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    {type === 'artista' ? <Music className="h-8 w-8" /> : type === 'discoteca' ? <Building2 className="h-8 w-8" /> : <User className="h-8 w-8" />}
                </div>
                <h3 className="text-xl font-bold text-white">No tienes un perfil de {label}</h3>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                    {esAdmin ? `Como Administrador, puedes crear un perfil de ${label} para experimentar la plataforma desde esa perspectiva.` : `Para interactuar como ${label}, debes inicializar tu perfil.`}
                </p>
            </div>
            <Button
                onClick={() => handleCreateProfile(type)}
                className="bg-white text-black hover:bg-zinc-200 font-semibold px-8 h-12 rounded-xl transition-transform active:scale-95"
            >
                <Plus className="mr-2 h-5 w-5" />
                Crear Perfil de {label}
            </Button>
        </div>
    );

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/home" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Mi Perfil</h1>
                        <p className="text-zinc-400 text-sm">Administra tu información personal{esArtista && ' y perfil artístico'}</p>
                    </div>
                </div>

                {esAdmin && (
                    <div className="mb-6 p-4 bg-zinc-900/30 border border-white/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
                        <div className="space-y-1 text-center md:text-left">
                            <h3 className="text-sm font-semibold text-indigo-400 flex items-center justify-center md:justify-start gap-2">
                                <User className="h-4 w-4" /> Modo Administrador
                            </h3>
                            <p className="text-xs text-zinc-400">Selecciona qué perfil deseas administrar actualmente.</p>
                        </div>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-full md:w-auto">
                            <button
                                onClick={() => { setViewAsRole('PUBLICO'); setActiveTab('personal'); }}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all ${viewAsRole === 'PUBLICO' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Público
                            </button>
                            <button
                                onClick={() => { setViewAsRole('ARTISTA'); setActiveTab('personal'); }}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all ${viewAsRole === 'ARTISTA' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Artista
                            </button>
                            <button
                                onClick={() => { setViewAsRole('DISCOTECA'); setActiveTab('personal'); }}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all ${viewAsRole === 'DISCOTECA' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Discoteca
                            </button>
                        </div>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={`grid w-full bg-zinc-900/50 border border-white/10 h-auto p-1 gap-1 ${showArtistTabs ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
                        <TabsTrigger value="personal" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            Personal
                        </TabsTrigger>
                        {showArtistTabs && (
                            <>
                                <TabsTrigger value="gallery" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                    Galería
                                </TabsTrigger>
                                <TabsTrigger value="social" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                    Redes
                                </TabsTrigger>
                                <TabsTrigger value="donation" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                    Donaciones
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="personal" className="mt-6">
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="text-center md:text-left">
                                        <CardTitle className="text-xl text-white">
                                            {esArtista ? 'Perfil Artístico' : esDiscoteca ? 'Perfil de Discoteca' : 'Información General'}
                                        </CardTitle>
                                        <CardDescription className="text-zinc-400">
                                            Estos datos son visibles para otros usuarios.
                                        </CardDescription>
                                    </div>
                                    {esAdmin && (
                                        <>
                                            {viewAsRole === 'ARTISTA' && perfilCompleto?.perfilArtista && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteProfile('artista')}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs h-8"
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar Perfil Artista
                                                </Button>
                                            )}
                                            {viewAsRole === 'DISCOTECA' && perfilCompleto?.perfilDiscoteca && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteProfile('discoteca')}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs h-8"
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar Perfil Discoteca
                                                </Button>
                                            )}
                                            {viewAsRole === 'PUBLICO' && perfilCompleto?.perfilPublico && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteProfile('publico')}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs h-8"
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar Perfil Público
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-8">
                                {esArtista ? (
                                    perfilCompleto?.perfilArtista ? (
                                        <ArtistProfileForm
                                            userData={perfilCompleto}
                                            onSubmit={async (data) => {
                                                setCargando(true);
                                                try {
                                                    const res = await fetchApi('/api/usuarios/perfil', {
                                                        method: 'PATCH',
                                                        body: JSON.stringify({
                                                            usuarioId: session?.user?.id,
                                                            ...data
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error("Error al actualizar");

                                                    toast.success("Perfil de artista actualizado con éxito");
                                                    cargarPerfil(); // Refresh
                                                } catch (error) {
                                                    console.error(error);
                                                    toast.error("Error al guardar cambios");
                                                } finally {
                                                    setCargando(false);
                                                }
                                            }}
                                            countries={countries}
                                            timezones={timezones}
                                            isLoading={cargando}
                                        />
                                    ) : (
                                        noProfilePlaceholder('artista', 'Artista')
                                    )
                                ) : esDiscoteca ? (
                                    perfilCompleto?.perfilDiscoteca ? (
                                        <VenueProfileForm
                                            userData={perfilCompleto}
                                            onSubmit={async (data) => {
                                                setCargando(true);
                                                try {
                                                    const res = await fetchApi('/api/usuarios/perfil', {
                                                        method: 'PATCH',
                                                        body: JSON.stringify({
                                                            usuarioId: session?.user?.id,
                                                            ...data
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error("Error al actualizar");

                                                    toast.success("Perfil de discoteca actualizado con éxito");
                                                    cargarPerfil(); // Refresh
                                                } catch (error) {
                                                    console.error(error);
                                                    toast.error("Error al guardar cambios");
                                                } finally {
                                                    setCargando(false);
                                                }
                                            }}
                                            countries={countries}
                                            timezones={timezones}
                                            isLoading={cargando}
                                        />
                                    ) : (
                                        noProfilePlaceholder('discoteca', 'Discoteca')
                                    )
                                ) : (
                                    perfilCompleto?.perfilPublico ? (
                                        <form onSubmit={manejarEnvio} className="space-y-6">
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label htmlFor="correo" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Correo Electrónico</Label>
                                                <Input
                                                    id="correo"
                                                    name="correo"
                                                    value={formData.correo}
                                                    disabled
                                                    className="bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed h-11 rounded-xl px-4 text-sm"
                                                />
                                                <p className="text-xs text-zinc-600 ml-1">El correo electrónico no se puede cambiar.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="nombre" className="text-zinc-300">Nombre Completo</Label>
                                                    <Input
                                                        id="nombre"
                                                        name="nombre"
                                                        value={formData.nombre}
                                                        onChange={manejarCambio}
                                                        className="bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500 transition-colors h-11 rounded-xl px-4 text-sm"
                                                    />
                                                </div>

                                                <UsernameInput
                                                    value={formData.nombreUsuario}
                                                    onChange={(val) => setFormData({ ...formData, nombreUsuario: val })}
                                                    onStatusChange={setUsuarioVerificado}
                                                    currentUsername={perfilCompleto?.nombreUsuario || session?.user?.nombreUsuario || ""}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="pais" className="text-zinc-300">País</Label>
                                                    <Select
                                                        value={formData.pais}
                                                        onValueChange={(value) => setFormData({ ...formData, pais: value })}
                                                    >
                                                        <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-white rounded-xl h-11 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                                            <SelectValue placeholder="Selecciona un país" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                                                            {countries.map(c => (
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
                                                <div className="space-y-2">
                                                    <Label htmlFor="ciudad" className="text-zinc-300">Ciudad</Label>
                                                    <Input
                                                        id="ciudad"
                                                        name="ciudad"
                                                        value={formData.ciudad}
                                                        onChange={manejarCambio}
                                                        className="bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500 transition-colors h-11 rounded-xl px-4 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="telefono" className="text-zinc-300">Número de celular</Label>
                                                    <div className="flex gap-3">
                                                        <CountryPhoneSelector
                                                            value={formData.codigoTelefono}
                                                            onValueChange={(value) => setFormData({ ...formData, codigoTelefono: value })}
                                                        />
                                                        <Input
                                                            id="telefono"
                                                            name="telefono"
                                                            value={formData.telefono}
                                                            onChange={manejarCambio}
                                                            className="bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500 transition-colors flex-1 h-11 rounded-xl px-4 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="zonaHoraria" className="text-zinc-300">Zona Horaria</Label>
                                                    <Select
                                                        value={formData.zonaHoraria}
                                                        onValueChange={(value) => setFormData({ ...formData, zonaHoraria: value })}
                                                    >
                                                        <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-white rounded-xl h-11 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                                            <SelectValue placeholder="Selecciona zona horaria" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[200px]">
                                                            {timezones.map((tz: string) => (
                                                                <SelectItem key={tz} value={tz}>
                                                                    {tz.replace(/_/g, ' ')}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={cargando || !usuarioVerificado}
                                                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold h-11 rounded-xl text-sm shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {cargando ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        Guardando cambios...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="mr-2 h-5 w-5" />
                                                        Guardar Cambios
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    ) : (
                                        noProfilePlaceholder('publico', 'Público')
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Artist-specific tabs */}
                    {esArtista && perfilCompleto?.perfilArtista && (
                        <>
                            <TabsContent value="gallery" className="mt-6">
                                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-white">Galería</CardTitle>
                                        <CardDescription className="text-zinc-400">
                                            Gestiona tus imágenes y fotos
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <GalleryForm
                                            galeria={perfilCompleto.perfilArtista.galeria || []}
                                            usuarioId={session?.user?.id || ""}
                                            onSave={cargarPerfil}
                                            onLoadingChange={setCargando}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="social" className="mt-6">
                                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-white">Redes Sociales</CardTitle>
                                        <CardDescription className="text-zinc-400">
                                            Conecta tus perfiles sociales
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <SocialMediaForm
                                            redesSociales={perfilCompleto.perfilArtista.redesSociales || []}
                                            usuarioId={session?.user?.id || ""}
                                            onSave={cargarPerfil}
                                            onLoadingChange={setCargando}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="donation" className="mt-6">
                                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-white">Métodos de Donación</CardTitle>
                                        <CardDescription className="text-zinc-400">
                                            Configura cómo pueden apoyarte
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <DonationForm
                                            metodosDonacion={perfilCompleto.perfilArtista.metodosDonacion || []}
                                            perfilArtista={perfilCompleto.perfilArtista}
                                            usuarioId={session?.user?.id || ""}
                                            onSave={cargarPerfil}
                                            onLoadingChange={setCargando}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>
            {cargando && <LoadingScreen />}
        </div >
    );
}
