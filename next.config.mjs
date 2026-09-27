/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },

  webpack(config, { dev }) {
    if (dev) {
      try {
        require.resolve('@dhiwise/component-tagger/nextLoader');
        config.module.rules.push({
          test: /\.(jsx|tsx)$/,
          exclude: [/node_modules/],
          use: [{
            loader: '@dhiwise/component-tagger/nextLoader',
          }],
        });
      } catch (e) {
        // @dhiwise/component-tagger not installed, skipping loader
      }
    }

    return config;
  }
};
export default nextConfig;
