import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Calendar as CalendarIcon } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { UsernameInput } from "@/components/auth/UsernameInput";
import { CountryPhoneSelector } from "@/components/ui/country-phone-selector";

interface VenueUserData {
    nombre?: string;
    nombreUsuario: string;
    correo: string;
    perfilDiscoteca?: {
        ciudad?: string;
        pais?: string;
        codigoTelefono?: string;
        numeroTelefono?: string;
        zonaHoraria?: string;
        fechaFundacion?: string | Date;
    };
}

interface VenueProfileFormProps {
    userData: VenueUserData;
    onSubmit: (data: Partial<VenueUserData> & { fechaFundacion?: string | null }) => Promise<void>;
    countries: { name: string; code: string; phoneCode: string }[];
    timezones: string[];
    isLoading: boolean;
}

// Normalization helper
const normalize = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const getInitialData = (userData: VenueUserData, countries: { name: string; code: string; phoneCode: string }[]) => {
    let paisCalculado = "PE";
    const paisGuardado = userData.perfilDiscoteca?.pais;

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
        nombre: userData.nombre || "",
        nombreUsuario: userData.nombreUsuario || "",
        ciudad: userData.perfilDiscoteca?.ciudad || "",
        pais: paisCalculado,
        codigoTelefono: userData.perfilDiscoteca?.codigoTelefono || "+51",
        numeroTelefono: userData.perfilDiscoteca?.numeroTelefono || "",
        zonaHoraria: userData.perfilDiscoteca?.zonaHoraria || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
};

export function VenueProfileForm({ userData, onSubmit, countries, timezones, isLoading }: VenueProfileFormProps) {
    const [formData, setFormData] = useState(() => getInitialData(userData, countries));

    const [fechaFundacion, setFechaFundacion] = useState<Date | undefined>(() =>
        userData.perfilDiscoteca?.fechaFundacion ? new Date(userData.perfilDiscoteca.fechaFundacion) : undefined
    );
    const [usuarioVerificado, setUsuarioVerificado] = useState(true);
    const [calendarioAbierto, setCalendarioAbierto] = useState(false);

    const isFirstRender = useRef(true);

    // Sync state if userData changes (e.g. refetch)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (userData) {
            const initialData = getInitialData(userData, countries);

            // Only update if data actually changed to avoid infinite loops
            if (JSON.stringify(initialData) !== JSON.stringify(formData)) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFormData(initialData);
            }

            if (userData.perfilDiscoteca?.fechaFundacion) {
                const newDate = new Date(userData.perfilDiscoteca.fechaFundacion);
                if (newDate.getTime() !== fechaFundacion?.getTime()) {
                    setFechaFundacion(newDate);
                }
            }
        }
    }, [userData, countries, formData, fechaFundacion]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "numeroTelefono") {
            const numericValue = value.replace(/\D/g, "");
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            fechaFundacion: fechaFundacion ? fechaFundacion.toISOString() : null
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Identity Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="nombre" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Nombre de la Discoteca</Label>
                    <Input
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        placeholder="Nombre comercial"
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

                <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Fecha de Fundación</Label>
                    <Popover open={calendarioAbierto} onOpenChange={setCalendarioAbierto}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:text-white h-11 rounded-xl px-4 text-sm",
                                    !fechaFundacion && "text-zinc-500"
                                )}
                            >
                                <CalendarIcon className="mr-3 h-4 w-4 opacity-50" />
                                {fechaFundacion ? format(fechaFundacion, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
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

            {/* Location & Contact Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        placeholder="Ciudad"
                    />
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
