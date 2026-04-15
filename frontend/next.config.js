/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Desativa em desenvolvimento para não interferir no hot reload
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  // Estratégias de cache para cada tipo de recurso
  runtimeCaching: [
    {
      // Páginas da aplicação — network first: sempre tenta buscar fresh
      urlPattern: /^https?.*(\/dashboard|\/acervo|\/clientes|\/locacoes|\/agenda)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 }, // 1h
        networkTimeoutSeconds: 10,
      },
    },
    {
      // API do backend — network first com fallback
      urlPattern: /^https?.*\/api\/v1\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, // 5min
        networkTimeoutSeconds: 8,
      },
    },
    {
      // Imagens do acervo (uploads)
      urlPattern: /^https?.*\/uploads\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 dias
      },
    },
    {
      // Fontes e recursos estáticos
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts-cache',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 ano
      },
    },
  ],
})

const nextConfig = withPWA({
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
})

module.exports = nextConfig
