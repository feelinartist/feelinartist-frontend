import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, Loader2, Save } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { UsernameInput } from "@/components/auth/UsernameInput";
import { CountryPhoneSelector } from "@/components/ui/country-phone-selector";

interface UserData {
    nombre?: string;
    nombreUsuario?: string;
    correo?: string;
    perfilArtista?: {
        nombreArtistico?: string;
        categoria?: string;
        biografia?: string;
        ciudad?: string;
        pais?: string;
        codigoTelefono?: string;
        numeroTelefono?: string;
        tarifaPorHora?: string;
        moneda?: string;
        zonaHoraria?: string;
        fechaInicio?: string | Date;
        lugaresConocidos?: string[] | string;
        urlYoutubeFavorito?: string;
        urlSoundCloudFavorito?: string;
    };
}

interface ArtistProfileFormProps {
    userData: UserData;
    onSubmit: (data: Partial<UserData> & { fechaInicio?: string | null }) => Promise<void>;
    countries: { name: string; code: string; phoneCode: string }[];
    timezones: string[];
    isLoading: boolean;
}

// Normalization helper
const normalize = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const getInitialData = (userData: UserData, countries: { name: string; code: string; phoneCode: string }[]) => {
    let paisCalculado = "PE";
    const paisGuardado = userData.perfilArtista?.pais;

    if (paisGuardado) {
        const exactMatch = countries.find(c => c.code === paisGuardado);
        if (exactMatch) {
            paisCalculado = exactMatch.code;
        } else {
            const nameMatch = countries.find(c => normalize(c.name) === normalize(paisGuardado));
            if (nameMatch) paisCalculado = nameMatch.code;
        }
    }

    return {
        nombreArtistico: userData.perfilArtista?.nombreArtistico || userData.nombre || "",
        nombreUsuario: userData.nombreUsuario || "",
        categoria: userData.perfilArtista?.categoria || "",
        biografia: userData.perfilArtista?.biografia || "",
        ciudad: userData.perfilArtista?.ciudad || "",
        pais: paisCalculado,
        codigoTelefono: userData.perfilArtista?.codigoTelefono || "+51",
        numeroTelefono: userData.perfilArtista?.numeroTelefono || "",
        tarifaPorHora: userData.perfilArtista?.tarifaPorHora || "",
        moneda: userData.perfilArtista?.moneda || "PEN",
        zonaHoraria: userData.perfilArtista?.zonaHoraria || Intl.DateTimeFormat().resolvedOptions().timeZone,
        urlYoutubeFavorito: userData.perfilArtista?.urlYoutubeFavorito || "",
        urlSoundCloudFavorito: userData.perfilArtista?.urlSoundCloudFavorito || "",
    };
};

const getInitialLugares = (userData: UserData): string[] => {
    const lugares = userData.perfilArtista?.lugaresConocidos;
    if (Array.isArray(lugares)) {
        return lugares;
    } else if (typeof lugares === 'string') {
        try {
            return JSON.parse(lugares);
        } catch (e) {
            console.error("Error parsing lugaresConocidos", e);
            return [];
        }
    }
    return [];
};

export function ArtistProfileForm({ userData, onSubmit, countries, timezones, isLoading }: ArtistProfileFormProps) {
    const [formData, setFormData] = useState(() => getInitialData(userData, countries));

    const [fechaInicio, setFechaInicio] = useState<Date | undefined>(() =>
        userData.perfilArtista?.fechaInicio ? new Date(userData.perfilArtista.fechaInicio) : undefined
    );
    const [lugaresConocidos, setLugaresConocidos] = useState<string[]>(() => getInitialLugares(userData));
    const [nuevoLugar, setNuevoLugar] = useState("");
    const [usuarioVerificado, setUsuarioVerificado] = useState(true);
    const [calendarioAbierto, setCalendarioAbierto] = useState(false);

    const isFirstRender = useRef(true);

    // Sync state from userData
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (userData) {
            const initialData = getInitialData(userData, countries);
            if (JSON.stringify(initialData) !== JSON.stringify(formData)) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFormData(initialData);
            }

            if (userData.perfilArtista?.fechaInicio) {
                const newDate = new Date(userData.perfilArtista.fechaInicio);
                if (newDate.getTime() !== fechaInicio?.getTime()) {
                    setFechaInicio(newDate);
                }
            }

            const newLugares = getInitialLugares(userData);
            if (JSON.stringify(newLugares) !== JSON.stringify(lugaresConocidos)) {
                setLugaresConocidos(newLugares);
            }
        }
    }, [userData, countries, formData, fechaInicio, lugaresConocidos]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "numeroTelefono") {
            const numericValue = value.replace(/\D/g, "");
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({ ...prev, categoria: value }));
    };

    const handleCurrencyChange = (value: string) => {
        setFormData(prev => ({ ...prev, moneda: value }));
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare payload merging separate states
        const payload = {
            ...formData,
            fechaInicio: fechaInicio ? fechaInicio.toISOString() : null,
            lugaresConocidos: lugaresConocidos
        };

        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Identity Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="nombreArtistico" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Nombre Artístico</Label>
                    <Input
                        id="nombreArtistico"
                        name="nombreArtistico"
                        value={formData.nombreArtistico}
                        onChange={handleChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        placeholder="Tu nombre de artista"
                    />
                </div>

                <div className="space-y-1.5">
                    <UsernameInput
                        value={formData.nombreUsuario}
                        onChange={(val) => setFormData(prev => ({ ...prev, nombreUsuario: val }))}
                        onStatusChange={setUsuarioVerificado}
                        currentUsername={userData.nombreUsuario}
                        className="w-full"
                    />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="correo" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Correo Electrónico</Label>
                    <Input
                        id="correo"
                        value={userData.correo || ""}
                        disabled
                        className="bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed h-11 rounded-xl px-4 text-sm"
                    />
                    <p className="text-xs text-zinc-600 ml-1">El correo electrónico no se puede cambiar.</p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="categoria" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Categoría</Label>
                    <Select value={formData.categoria} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm">
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
                                    !fechaInicio && "text-zinc-500"
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
                        <Select value={formData.moneda} onValueChange={handleCurrencyChange}>
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
                            value={formData.tarifaPorHora}
                            onChange={handleChange}
                            className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm flex-1"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="numeroTelefono" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Número de celular</Label>
                    <div className="flex gap-3">
                        <CountryPhoneSelector
                            value={formData.codigoTelefono}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, codigoTelefono: val }))}
                        />
                        <Input
                            id="numeroTelefono"
                            name="numeroTelefono"
                            value={formData.numeroTelefono}
                            onChange={handleChange}
                            className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm flex-1"
                            placeholder="999 999 999"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="pais" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">País</Label>
                    <Select
                        value={formData.pais}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, pais: val }))}
                    >
                        <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm">
                            <SelectValue placeholder="Selecciona tu país" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl max-h-[300px]">
                            {countries.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                    <div className="flex items-center gap-2">
                                        <Image
                                            src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                                            alt={c.name}
                                            width={20}
                                            height={15}
                                            className="w-5 h-auto object-cover rounded-sm"
                                            unoptimized
                                        />
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
                        value={formData.ciudad}
                        onChange={handleChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        placeholder="Tu ciudad"
                    />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="zonaHoraria" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Zona Horaria</Label>
                    <Select
                        value={formData.zonaHoraria}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, zonaHoraria: val }))}
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
                        value={formData.biografia}
                        onChange={handleChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white min-h-[120px] rounded-xl px-4 py-3 text-sm resize-none"
                        placeholder="Cuéntanos un poco sobre ti..."
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
                            className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        />
                        <Button type="button" onClick={agregarLugar} variant="secondary" className="h-11 w-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white p-0 flex items-center justify-center shrink-0">
                            <span className="text-xl">+</span>
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {lugaresConocidos.map((lugar, index) => (
                            <div key={index} className="flex items-center gap-1 bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full text-xs">
                                <span>{lugar}</span>
                                <button type="button" onClick={() => removerLugar(index)} className="hover:text-white cursor-pointer ml-1 opacity-60 hover:opacity-100">
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Multimedia Favorita */}
                <div className="space-y-1.5">
                    <Label htmlFor="urlYoutubeFavorito" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Video Favorito de YouTube (URL)</Label>
                    <Input
                        id="urlYoutubeFavorito"
                        name="urlYoutubeFavorito"
                        value={formData.urlYoutubeFavorito || ""}
                        onChange={handleChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-zinc-600 ml-1">Comparte tu video favorito para que te conozcan mejor</p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="urlSoundCloudFavorito" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Canción Favorita de SoundCloud (URL)</Label>
                    <Input
                        id="urlSoundCloudFavorito"
                        name="urlSoundCloudFavorito"
                        value={formData.urlSoundCloudFavorito || ""}
                        onChange={handleChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        placeholder="https://soundcloud.com/..."
                    />
                    <p className="text-xs text-zinc-600 ml-1">Comparte tu canción favorita para que te conozcan mejor</p>
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
                            Guardando cambios...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
