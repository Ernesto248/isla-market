/**
 * Configuración optimizada de Next.js para testing con Playwright/TestSprite
 *
 * Problemas detectados en modo dev:
 * - ERR_EMPTY_RESPONSE en assets estáticos
 * - Timeouts en navegadores automatizados
 * - Errores de hydration
 *
 * Soluciones propuestas:
 * 1. Deshabilitar Fast Refresh durante tests
 * 2. Aumentar timeout de compilación
 * 3. Deshabilitar optimizaciones que causan problemas
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración para testing automatizado
  ...(process.env.NODE_ENV === "test"
    ? {
        // Deshabilitar Fast Refresh durante tests
        reactStrictMode: false,

        // Optimizaciones de compilación
        swcMinify: false,

        // Deshabilitar optimizaciones de fuentes
        optimizeFonts: false,
      }
    : {}),

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cms-next.sfo3.digitaloceanspaces.com",
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Suprimir advertencias específicas de Supabase Realtime
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    // Aumentar timeout de compilación para tests
    if (process.env.TESTING_MODE === "true") {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
        aggregateTimeout: 300,
        poll: false,
      };
    }

    return config;
  },

  // Configuración de servidor
  experimental: {
    // Ajustes para mejorar estabilidad durante tests
    serverActions: true,
  },

  // Headers para mejorar caching durante tests
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
