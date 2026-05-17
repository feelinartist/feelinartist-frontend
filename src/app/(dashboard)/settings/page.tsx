"use client";

import { fetchApi } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatedBackground } from "@/components/animated-background";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";
import { Loader2, Shield, UserX, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { countries } from "@/lib/countries";

interface BlockedUser {
    id: string;
    nombre?: string;
    nombreUsuario?: string;
    correo?: string;
    imagen?: string;
    [key: string]: unknown;
}

interface MigrationData {
    pais?: string;
    ciudad?: string;
    nombreArtistico?: string;
    categoria?: string;
    nombre?: string;
    [key: string]: unknown;
}

export default function PaginaConfiguracion() {
    const { data: session } = useSession();
    const [cargando, setCargando] = useState(false);
    const [bloqueados, setBloqueados] = useState<BlockedUser[]>([]);
    const [cargandoBloqueados, setCargandoBloqueados] = useState(false);

    // Migration State
    const [migrando, setMigrando] = useState(false);
    const [dialogoMigracionAbierto, setDialogoMigracionAbierto] = useState(false);
    const [nuevoRol, setNuevoRol] = useState<string>("");
    const [datosMigracion, setDatosMigracion] = useState<MigrationData>({});

    const [perfilesExistentes, setPerfilesExistentes] = useState({
        artista: false,
        publico: false,
        discoteca: false
    });


    // Initial load handled by effect below

    // Static lists for now
    // countries list imported from @/lib/country-codes

    const handlePaisChange = (pais: string) => {
        setDatosMigracion({ ...datosMigracion, pais });
        // Reset city when country changes
        setDatosMigracion((prev: MigrationData) => ({ ...prev, ciudad: '' }));
    };

    const migrarRol = async () => {
        if (!nuevoRol) return;
        setMigrando(true);
        try {
            const res = await fetchApi('/api/usuarios/migrar-rol', {
                method: 'POST',
                body: JSON.stringify({
                    usuarioId: session?.user?.id,
                    nuevoRol,
                    datosPerfil: datosMigracion
                })
            });

            if (res.ok) {
                toast.success("Rol migrado exitosamente. Reiniciando sesión...");
                setTimeout(() => signOut({ callbackUrl: '/home' }), 2000);
            } else {
                const error = await res.json();
                toast.error(error.message || "Error al migrar rol");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al migrar rol");
        } finally {
            setMigrando(false);
        }
    };

    const cargarBloqueados = useCallback(async () => {
        setCargandoBloqueados(true);
        try {
            const res = await fetchApi(`/api/usuarios/bloqueados/${session?.user?.id}`);
            if (res.ok) {
                const data = await res.json();
                setBloqueados(data);
            }
        } catch (error) {
            console.error("Error cargando bloqueados:", error);
        } finally {
            setCargandoBloqueados(false);
        }
    }, [session?.user?.id]);

    const cargarPerfil = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetchApi(`/api/usuarios/perfil/${session.user.id}`);
            if (res.ok) {
                const data = await res.json();
                setPerfilesExistentes({
                    artista: !!data.perfilArtista,
                    publico: !!data.perfilPublico,
                    discoteca: !!data.perfilDiscoteca
                });
            }
        } catch (error) {
            console.error("Error cargando perfil:", error);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (session?.user?.id) {
            cargarBloqueados();
            cargarPerfil();
        }
    }, [session?.user?.id, cargarBloqueados, cargarPerfil]);

    const desbloquearUsuario = async (bloqueadoId: string) => {
        try {
            const res = await fetchApi('/api/usuarios/desbloquear', {
                method: 'POST',
                body: JSON.stringify({
                    bloqueadorId: session?.user?.id,
                    bloqueadoId
                })
            });

            if (res.ok) {
                toast.success("Usuario desbloqueado");
                cargarBloqueados();
            } else {
                toast.error("Error al desbloquear");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al desbloquear");
        }
    };

    const deshabilitarCuenta = async () => {
        setCargando(true);
        try {
            const res = await fetchApi('/api/usuarios/deshabilitar', {
                method: 'PATCH',
                body: JSON.stringify({ usuarioId: session?.user?.id })
            });

            if (res.ok) {
                toast.success("Cuenta deshabilitada. Cerrando sesión...");
                setTimeout(() => signOut({ callbackUrl: '/' }), 2000);
            } else {
                toast.error("Error al deshabilitar cuenta");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al deshabilitar cuenta");
        } finally {
            setCargando(false);
        }
    };

    const eliminarCuenta = async () => {
        setCargando(true);
        try {
            const res = await fetchApi('/api/usuarios/eliminar', {
                method: 'DELETE',
                body: JSON.stringify({ usuarioId: session?.user?.id })
            });

            if (res.ok) {
                toast.success("Cuenta programada para eliminación. Cerrando sesión...");
                setTimeout(() => signOut({ callbackUrl: '/' }), 2000);
            } else {
                toast.error("Error al eliminar cuenta");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar cuenta");
        } finally {
            setCargando(false);
        }
    };

    const eliminarPerfilAdmin = async (tipo: string) => {
        setCargando(true);
        try {
            const res = await fetchApi(`/api/admin/usuarios/perfil/${tipo}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success(`Perfil de ${tipo} eliminado. Reiniciando sesión...`);
                setTimeout(() => signOut({ callbackUrl: '/home' }), 2000);
            } else {
                toast.error(`Error al eliminar perfil de ${tipo}`);
            }
        } catch (error) {
            console.error(error);
            toast.error(`Error al eliminar perfil de ${tipo}`);
        } finally {
            setCargando(false);
        }
    };

    if (cargando || migrando) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/home" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Configuración</h1>
                        <p className="text-zinc-400 text-sm">Administra tu cuenta y privacidad</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Privacy Section */}
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <Shield className="h-5 w-5 text-indigo-400" />
                                Privacidad
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Gestiona los usuarios bloqueados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                <div>
                                    <h4 className="text-white font-medium">Usuarios Bloqueados</h4>
                                    <p className="text-zinc-500 text-sm mt-1">
                                        Ver y gestionar la lista de usuarios que has bloqueado.
                                    </p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-black border border-white/20 text-white hover:bg-[#8F00FF] hover:border-[#8F00FF] transition-colors">
                                            Ver Lista
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Usuarios Bloqueados</DialogTitle>
                                            <DialogDescription className="text-zinc-400">
                                                Lista de usuarios que no pueden ver tu perfil ni interactuar contigo.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            {cargandoBloqueados ? (
                                                <div className="flex justify-center p-4">
                                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                                </div>
                                            ) : bloqueados.length > 0 ? (
                                                <div className="space-y-3">
                                                    {bloqueados.map((usuario) => (
                                                        <div key={usuario.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden">
                                                                    {usuario.imagen ? (
                                                                        <div className="relative w-full h-full">
                                                                            <Image
                                                                                src={usuario.imagen}
                                                                                alt={usuario.nombre || "Usuario"}
                                                                                fill
                                                                                className="object-cover"
                                                                                unoptimized
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                                                            {usuario.nombre?.[0] || 'U'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-white text-sm font-medium">{usuario.nombre || usuario.nombreUsuario}</p>
                                                                    <p className="text-zinc-500 text-xs">{usuario.correo}</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => desbloquearUsuario(usuario.id)}
                                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                            >
                                                                Desbloquear
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-zinc-500 text-sm italic text-center">No has bloqueado a ningún usuario.</p>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role Migration Section - Hidden for SuperAdmin */}
                    {session?.user?.rol !== 'SUPER_ADMIN' && session?.user?.rol !== 'ADMIN' && (
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-xl text-white flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 text-green-400" />
                                    Migración de Rol
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Cambia tu rol actual (Artista, Público, Discoteca).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                    <div>
                                        <h4 className="text-white font-medium">Cambiar Rol</h4>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            Migra tu cuenta a otro tipo de perfil. Se te pedirán datos adicionales si es necesario.
                                        </p>
                                    </div>
                                    <Dialog open={dialogoMigracionAbierto} onOpenChange={setDialogoMigracionAbierto}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-black border border-white/20 text-white hover:bg-[#8F00FF] hover:border-[#8F00FF] transition-colors">
                                                Migrar
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Migrar Rol</DialogTitle>
                                                <DialogDescription className="text-zinc-400">
                                                    Selecciona el nuevo rol y completa la información requerida.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Nuevo Rol</Label>
                                                    <Select onValueChange={(val) => setNuevoRol(val)}>
                                                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                            <SelectValue placeholder="Selecciona un rol" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                                            {session?.user?.rol !== 'ARTISTA' && <SelectItem value="ARTISTA">Artista</SelectItem>}
                                                            {session?.user?.rol !== 'PUBLICO' && <SelectItem value="PUBLICO">Público</SelectItem>}
                                                            {session?.user?.rol !== 'DISCOTECA' && <SelectItem value="DISCOTECA">Discoteca</SelectItem>}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {nuevoRol === 'ARTISTA' && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>Nombre Artístico</Label>
                                                            <Input
                                                                className="bg-zinc-800 border-zinc-700 text-white"
                                                                onChange={(e) => setDatosMigracion({ ...datosMigracion, nombreArtistico: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Categoría</Label>
                                                            <Select onValueChange={(val) => setDatosMigracion({ ...datosMigracion, categoria: val })}>
                                                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                                    <SelectValue placeholder="Selecciona categoría" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                                                    <SelectItem value="DJ">DJ</SelectItem>
                                                                    <SelectItem value="BANDA">Banda</SelectItem>
                                                                    <SelectItem value="SOLISTA">Solista</SelectItem>
                                                                    <SelectItem value="ORQUESTA">Orquesta</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </>
                                                )}

                                                {nuevoRol === 'DISCOTECA' && (
                                                    <div className="space-y-2">
                                                        <Label>Nombre de la Discoteca</Label>
                                                        <Input
                                                            className="bg-zinc-800 border-zinc-700 text-white"
                                                            onChange={(e) => setDatosMigracion({ ...datosMigracion, nombre: e.target.value })}
                                                        />
                                                    </div>
                                                )}

                                                {(nuevoRol === 'ARTISTA' || nuevoRol === 'DISCOTECA' || nuevoRol === 'PUBLICO') && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>País</Label>
                                                            <Select onValueChange={handlePaisChange}>
                                                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                                    <SelectValue placeholder="Selecciona país" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                                                    {countries.map(p => (
                                                                        <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Ciudad</Label>
                                                            <Input
                                                                placeholder="Ingresa tu ciudad"
                                                                className="bg-zinc-800 border-zinc-700 text-white"
                                                                onChange={(e) => setDatosMigracion({ ...datosMigracion, ciudad: e.target.value })}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <DialogFooter>
                                                <Button variant="ghost" onClick={() => setDialogoMigracionAbierto(false)} className="text-zinc-400 hover:text-white">Cancelar</Button>
                                                <Button onClick={migrarRol} disabled={migrando || !nuevoRol} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                    {migrando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Migración"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Admin Profile Management */}
                    {(session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN') && (
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-xl text-white flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-indigo-400" />
                                    Gestión de Perfil de Prueba (Admin)
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Crea o elimina perfiles sin perder tus privilegios de administrador.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Artista */}
                                <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                    <div>
                                        <h4 className="text-white font-medium">Perfil de Artista</h4>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            {perfilesExistentes.artista ? "Ya tienes un perfil de artista activo." : "Crea un perfil de artista para probar la plataforma."}
                                        </p>
                                    </div>
                                    {perfilesExistentes.artista ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                    Eliminar Perfil
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar Perfil de Artista?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-zinc-400">
                                                        Esto eliminará todos los datos asociados al perfil de artista (eventos, redes, donaciones) pero mantendrá tu cuenta de Administrador intacta.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => eliminarPerfilAdmin('artista')} className="bg-red-600 hover:bg-red-700 text-white">
                                                        Sí, eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <Button 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={() => window.location.href = '/artist-registration'}
                                        >
                                            Crear Perfil
                                        </Button>
                                    )}
                                </div>

                                {/* Discoteca */}
                                <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                    <div>
                                        <h4 className="text-white font-medium">Perfil de Discoteca</h4>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            {perfilesExistentes.discoteca ? "Ya tienes un perfil de discoteca activo." : "Crea un perfil de discoteca para probar la plataforma."}
                                        </p>
                                    </div>
                                    {perfilesExistentes.discoteca ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                    Eliminar Perfil
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar Perfil de Discoteca?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-zinc-400">
                                                        Esto eliminará todos los datos asociados al perfil de discoteca pero mantendrá tu cuenta de Administrador intacta.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => eliminarPerfilAdmin('discoteca')} className="bg-red-600 hover:bg-red-700 text-white">
                                                        Sí, eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <Button 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={() => window.location.href = '/venue-registration'}
                                        >
                                            Crear Perfil
                                        </Button>
                                    )}
                                </div>

                                {/* Público */}
                                <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                    <div>
                                        <h4 className="text-white font-medium">Perfil de Público</h4>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            {perfilesExistentes.publico ? "Ya tienes un perfil de público activo." : "Crea un perfil de público para probar la plataforma."}
                                        </p>
                                    </div>
                                    {perfilesExistentes.publico ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                    Eliminar Perfil
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar Perfil de Público?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-zinc-400">
                                                        Esto eliminará todos los datos asociados al perfil de público pero mantendrá tu cuenta de Administrador intacta.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => eliminarPerfilAdmin('publico')} className="bg-red-600 hover:bg-red-700 text-white">
                                                        Sí, eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <Button 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={() => window.location.href = '/public-registration'}
                                        >
                                            Crear Perfil
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Account Management Section */}
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl border-t-red-900/50">
                        <CardHeader>
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <UserX className="h-5 w-5 text-red-400" />
                                Gestión de Cuenta
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Acciones peligrosas para tu cuenta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                <div>
                                    <h4 className="text-white font-medium">Deshabilitar Cuenta</h4>
                                    <p className="text-zinc-500 text-sm mt-1">
                                        Tu perfil será ocultado pero podrás reactivarlo iniciando sesión.
                                    </p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="bg-black border border-white/20 text-white hover:bg-[#8F00FF] hover:border-[#8F00FF] transition-colors">
                                            Deshabilitar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-zinc-400">
                                                Tu cuenta será deshabilitada y tu perfil no será visible para nadie. Podrás reactivarla en cualquier momento iniciando sesión.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={deshabilitarCuenta} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                                Sí, deshabilitar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>

                            {/* Delete Account - Hidden for SuperAdmin */}
                            {session?.user?.rol !== 'SUPER_ADMIN' && (
                                <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg bg-red-900/10">
                                    <div>
                                        <h4 className="text-white font-medium">Eliminar Cuenta</h4>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            Se programará para eliminación en 30 días.
                                        </p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Eliminar
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar cuenta permanentemente?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-zinc-400">
                                                    Tu cuenta será deshabilitada inmediatamente y eliminada permanentemente en 30 días. Si inicias sesión antes de los 30 días, la eliminación se cancelará.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={eliminarCuenta} className="bg-red-600 hover:bg-red-700 text-white">
                                                    Sí, eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
