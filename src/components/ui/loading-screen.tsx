import { Loader2 } from "lucide-react";

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center text-white z-[9999]" style={{ backgroundColor: "#000000" }}>
            <Loader2 className="h-10 w-10 animate-spin text-white mb-4" />
            <p className="text-zinc-400 text-sm animate-pulse">Cargando...</p>
        </div>
    );
}
