import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desactivar features experimentales que causan cuelgues en el worker de Turbopack en CI/Vercel
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
