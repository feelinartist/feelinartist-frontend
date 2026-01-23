import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { AnimatedBackground } from "@/components/animated-background";

export default function PrivacyPage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
            <AnimatedBackground />
            <Card className="z-10 w-full max-w-4xl border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
                <CardHeader className="relative pb-2">
                    <BackButton href="/login" className="absolute left-4 top-4" />
                    <CardTitle className="text-3xl md:text-4xl font-bold text-center pt-8 text-white">Política de Privacidad</CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8 text-zinc-300">
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">1. Información que Recopilamos</h2>
                        <p className="leading-relaxed">
                            Recopilamos información básica de tu perfil de Google (nombre, correo electrónico, foto) cuando inicias sesión. También recopilamos datos sobre tu interacción con los eventos y artistas.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">2. Uso de la Información</h2>
                        <div className="leading-relaxed">
                            Utilizamos tu información para:
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>Proporcionar y mantener el servicio.</li>
                                <li>Personalizar tu experiencia en eventos.</li>
                                <li>Comunicarnos contigo sobre actualizaciones o cambios.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">3. Visibilidad y Compartición de Datos</h2>
                        <div className="leading-relaxed space-y-4">
                            <p>
                                <strong>IMPORTANTE: Naturaleza Pública de la Plataforma.</strong>
                            </p>
                            <p>
                                Feelin opera bajo un principio de transparencia total. Al utilizar nuestros servicios, <strong>aceptas y reconoces explícitamente que todos los datos recopilados en esta plataforma se brindarán y serán visibles para todos los usuarios.</strong>
                            </p>
                            <p>
                                Esto incluye, pero no se limita a:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Información de tu perfil público (nombre, foto, identificación).</li>
                                <li>Historial de solicitudes de canciones y dedicatorias.</li>
                                <li>Interacciones en tiempo real en los eventos.</li>
                            </ul>
                            <p>
                                Tu información es accesible tanto para Artistas y Discotecas como para otros miembros del Público para fomentar la interacción social del ecosistema.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">4. Seguridad</h2>
                        <p className="leading-relaxed">
                            Tomamos medidas razonables para proteger tu información personal contra acceso no autorizado o divulgación.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-white/10">
                        <p className="text-sm text-zinc-500 text-center">Última actualización: Diciembre 2025</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
