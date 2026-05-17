"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2, Save, Instagram, Twitter, Facebook,
    Youtube, Globe, MessageSquare, Music
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";

interface SocialMediaItem {
    id: string;
    nombreUsuario: string;
    redSocial: {
        id: string;
        nombre: string;
        icono: string;
        urlBase: string;
    };
    redSocialId?: string;
}

interface SocialMediaFormProps {
    redesSociales: SocialMediaItem[];
    usuarioId: string;
    onSave: () => void;
    onLoadingChange?: (loading: boolean) => void;
}

interface SocialMediaEntry {
    redSocialId: string;
    nombreRed: string;
    nombreUsuario: string;
}

interface RedSocial {
    id: string;
    nombre: string;
    icono?: string;
    urlBase?: string;
}

export function SocialMediaForm({ redesSociales, usuarioId, onSave, onLoadingChange }: SocialMediaFormProps) {
    const [loading, setLoading] = useState(false);
    const [availableNetworks, setAvailableNetworks] = useState<RedSocial[]>([]);
    const [socialMediaEntries, setSocialMediaEntries] = useState<Record<string, SocialMediaEntry>>({});

    const setGlobalLoading = (isLoading: boolean) => {
        setLoading(isLoading);
        onLoadingChange?.(isLoading);
    };

    useEffect(() => {
        fetchAvailableNetworks();
    }, []);

    useEffect(() => {
        // Initialize with existing data merging with available networks
        if (availableNetworks.length > 0) {
            const entries: Record<string, SocialMediaEntry> = {};

            availableNetworks.forEach(network => {
                const existing = redesSociales?.find(rs => (rs.redSocial?.id || rs.redSocialId) === network.id);

                if (existing) {
                    entries[network.id] = {
                        redSocialId: network.id,
                        nombreRed: network.nombre,
                        nombreUsuario: existing.nombreUsuario || ""
                    };
                } else {
                    entries[network.id] = {
                        redSocialId: network.id,
                        nombreRed: network.nombre,
                        nombreUsuario: ""
                    };
                }
            });

            setSocialMediaEntries(entries);
        }
    }, [redesSociales, availableNetworks]);

    const fetchAvailableNetworks = async () => {
        try {
            const res = await fetchApi('/api/config/redes-sociales');
            if (res.ok) {
                const data = await res.json();
                setAvailableNetworks(data);

                // Initialize empty entries for all networks
                const entries: Record<string, SocialMediaEntry> = {};
                data.forEach((network: { id: string; nombre: string; icono?: string; urlBase?: string }) => {
                    entries[network.id] = {
                        redSocialId: network.id,
                        nombreRed: network.nombre,
                        nombreUsuario: ""
                    };
                });
                setSocialMediaEntries(entries);
            }
        } catch (error) {
            console.error("Error loading social networks:", error);
        }
    };

    const getPlaceholder = (networkName: string) => {
        const name = networkName.toLowerCase();
        if (name.includes('facebook')) return "tu.nombre";
        if (name.includes('instagram')) return "tuusuario";
        if (name.includes('twitter') || name.includes('x')) return "tuusuario";
        if (name.includes('tiktok')) return "tuusuario";
        if (name.includes('youtube')) return "tucanal";

        if (name.includes('soundcloud')) return "tuusuario";
        if (name.includes('twitch')) return "tucanal";
        if (name.includes('kick')) return "tucanal";
        return "tuusuario";
    };



    const handleChange = (networkId: string, field: 'nombreUsuario' | 'codigoTelefono' | 'numeroTelefono', value: string) => {
        setSocialMediaEntries(prev => ({
            ...prev,
            [networkId]: {
                ...prev[networkId],
                [field]: value
            }
        }));
    };

    const getIcon = (networkName: string, dbIcon?: string) => {
        if (dbIcon?.startsWith('http')) {
            return <Image src={dbIcon} alt={networkName} width={16} height={16} className="h-4 w-4 object-contain filter brightness-110" unoptimized />;
        }

        const name = (dbIcon || networkName).toLowerCase();
        if (name.includes('instagram')) return <Instagram className="h-4 w-4 text-pink-500" />;
        if (name.includes('twitter') || name.includes('x')) return <Twitter className="h-4 w-4 text-sky-400" />;
        if (name.includes('facebook')) return <Facebook className="h-4 w-4 text-blue-600" />;
        if (name.includes('youtube')) return <Youtube className="h-4 w-4 text-red-600" />;
        if (name.includes('whatsapp')) return <MessageSquare className="h-4 w-4 text-green-500" />;
        if (name.includes('soundcloud')) return <Music className="h-4 w-4 text-green-400" />;
        if (name.includes('kick')) return <Globe className="h-4 w-4 text-green-400" />;
        return <Globe className="h-4 w-4 text-zinc-400" />;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalLoading(true);

        try {
            // Convert to array format, only include networks with data
            const socialMediaArray = Object.values(socialMediaEntries)
                .filter(entry => entry.nombreUsuario && entry.nombreUsuario.trim() !== "")
                .map(entry => ({
                    redSocialId: entry.redSocialId,
                    nombreUsuario: entry.nombreUsuario
                }));

            const response = await fetchApi('/api/usuarios/perfil', {
                method: 'PATCH',
                body: JSON.stringify({
                    usuarioId,
                    redesSociales: socialMediaArray
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Error al guardar");
            }

            toast.success("Redes sociales actualizadas correctamente");
            onSave();
        } catch (error: unknown) {
            console.error("Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al actualizar redes sociales";
            toast.error(errorMessage);
        } finally {
            setGlobalLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {availableNetworks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableNetworks.map(network => {
                            const entry = socialMediaEntries[network.id];
                            const prefix = network.urlBase ? network.urlBase.replace(/^https?:\/\/(www\.)?/, '') : '';
                            const placeholder = getPlaceholder(network.nombre);

                            return (
                                <div key={network.id} className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2">
                                        {getIcon(network.nombre, network.icono)}
                                        {network.nombre}
                                    </Label>
                                    {prefix ? (
                                        <div className="flex items-center gap-0 bg-zinc-900/50 border border-zinc-800 rounded-xl h-11 overflow-hidden focus-within:border-indigo-500 transition-colors">
                                            <span className="text-zinc-500 pl-3 pr-1 text-xs select-none bg-zinc-900/50 h-full flex items-center border-r border-zinc-800/50 whitespace-nowrap">
                                                {prefix}
                                            </span>
                                            <Input
                                                value={entry?.nombreUsuario || ""}
                                                onChange={(e) => handleChange(network.id, 'nombreUsuario', e.target.value)}
                                                placeholder={placeholder}
                                                className="flex-1 bg-transparent border-0 text-white focus:ring-0 focus:border-0 h-full rounded-none px-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-600"
                                            />
                                        </div>
                                    ) : (
                                        <Input
                                            value={entry?.nombreUsuario || ""}
                                            onChange={(e) => handleChange(network.id, 'nombreUsuario', e.target.value)}
                                            placeholder={placeholder}
                                            className="bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500 transition-colors h-11 rounded-xl px-4 text-sm"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-600 mb-4" />
                        <p className="text-zinc-400 text-sm">Cargando redes sociales...</p>
                    </div>
                )}
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-zinc-200 font-semibold h-11 rounded-xl text-sm shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || availableNetworks.length === 0}
                >
                    {loading ? (
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
            </div>
        </form>
    );
}
