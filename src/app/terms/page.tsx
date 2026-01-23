import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BackButton } from "@/components/ui/back-button";
import { AnimatedBackground } from "@/components/animated-background";

export default function TermsPage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
            <AnimatedBackground />
            <Card className="z-10 w-full max-w-4xl border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
                <CardHeader className="relative pb-2">
                    <BackButton href="/login" className="absolute left-4 top-4" />
                    <CardTitle className="text-3xl md:text-4xl font-bold text-center pt-8 text-white">Términos de Servicio</CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8 text-zinc-300">
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">1. Aceptación de los Términos</h2>
                        <p className="leading-relaxed">
                            Al acceder y utilizar Feelin, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">2. Descripción del Servicio</h2>
                        <p className="leading-relaxed">
                            Feelin es una plataforma que conecta a artistas con su audiencia en eventos en vivo, permitiendo la interacción y solicitud de canciones.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">3. Cuentas de Usuario</h2>
                        <p className="leading-relaxed">
                            Para utilizar ciertas funciones, debes registrarte utilizando tu cuenta de Google. Eres responsable de mantener la confidencialidad de tu cuenta.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">4. Conducta del Usuario</h2>
                        <p className="leading-relaxed">
                            Te comprometes a no utilizar el servicio para fines ilegales o no autorizados. El acoso, la incitación al odio y el contenido inapropiado están prohibidos.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">5. Transparencia y Datos Públicos</h2>
                        <p className="leading-relaxed">
                            Al registrarte y usar Feelin, aceptas que la plataforma opera bajo un modelo de datos abiertos dentro de su ecosistema. Toda la información generada o proporcionada por ti (perfil, actividad, solicitudes) estará disponible para el resto de los usuarios de la plataforma. Renuncias a cualquier expectativa de privacidad sobre la información compartida a través de las funciones principales del servicio.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">6. Modificaciones</h2>
                        <p className="leading-relaxed">
                            Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos sobre cualquier cambio importante.
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
