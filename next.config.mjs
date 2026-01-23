/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/uploads/:path*`,
            },
        ];
    },
};

export default nextConfig;
