class ConfigService {
    private cache: Map<string, string> = new Map();
    private initialized = false;

    /**
     * Obtiene una configuración.
     * Si no está inicializado, intenta hacer fetch de todas las configuraciones críticas primero.
     */
    async get(clave: string, defaultValue?: string): Promise<string> {
        if (!this.initialized) {
            await this.initialize();
        }

        const value = this.cache.get(clave);
        return value !== undefined ? value : (defaultValue || "");
    }

    /**
     * Carga las configuraciones desde el Backend.
     * Esto se ejecuta una vez al inicio (o bajo demanda).
     */
    private async initialize() {
        if (this.initialized) return;

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const apiKey = process.env.INTERNAL_API_KEY || '';

            if (!apiKey) {
                console.error("INTERNAL_API_KEY no definida en frontend. No se puede obtener configuración.");
                return;
            }

            console.log("Fetching configuration from backend...");
            const response = await fetch(`${backendUrl}/api/internal/config/auth`, {
                headers: {
                    'x-internal-api-key': apiKey
                },
                // Next.js caching: revalidate every hour or keep static depending on needs.
                // For secrets, maybe no-store is safer to ensure freshness upon restart?
                // But for performance, caching is key. Next.js extends fetch.
                next: { revalidate: 60 }
            });

            if (!response.ok) {
                throw new Error(`Error fetching config: ${response.status} ${response.statusText}`);
            }

            const configs = await response.json();

            // Populate cache
            Object.entries(configs).forEach(([key, value]) => {
                this.cache.set(key, value as string);
            });

            this.initialized = true;
            console.log("Configuration initialized from Backend.");
        } catch (error) {
            console.error("Failed to initialize configuration:", error);
            // Fallback: no hacer nada, los get() devolverán defaultValue si existen
        }
    }
}

export const configService = new ConfigService();
