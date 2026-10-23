import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config para silenciar la colisión con webpack en Next.js 16
  turbopack: {},

  // Headers obligatorios para SharedArrayBuffer (mGBA-wasm pthreads)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },

  // Webpack config para manejar archivos .wasm correctamente
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
