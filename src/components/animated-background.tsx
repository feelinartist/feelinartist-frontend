export function AnimatedBackground() {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute -left-20 -top-20 h-[500px] w-[500px] animate-blob rounded-full bg-indigo-500/20 blur-[120px]" />
            <div className="absolute -bottom-20 -right-20 h-[500px] w-[500px] animate-blob rounded-full bg-purple-500/20 blur-[120px]" style={{ animationDelay: "2s" }} />
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-blob rounded-full bg-blue-500/10 blur-[100px]" style={{ animationDelay: "4s" }} />
        </div>
    );
}
