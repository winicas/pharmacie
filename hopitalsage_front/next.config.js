/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    domains: ['localhost'], // Permet d'afficher des images venant du backend local
  },
};

module.exports = nextConfig;
