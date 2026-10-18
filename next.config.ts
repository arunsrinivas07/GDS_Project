import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to the learning page routes only.
        source: "/learn/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow Bunny Stream player and CDN for video iframes
              "frame-src https://iframe.mediadelivery.net https://*.b-cdn.net",
              // Allow scripts from Bunny player and Next.js / React Turbopack dev tools ('unsafe-eval')
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://iframe.mediadelivery.net",
              // Allow styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Allow images from Bunny CDN and Supabase Storage
              "img-src 'self' data: https://*.b-cdn.net https://*.supabase.co",
              // Allow connections to Supabase and Bunny APIs
              "connect-src 'self' https://*.supabase.co https://*.b-cdn.net https://iframe.mediadelivery.net",
            ].join("; "),
          },
          {
            // Prevent the learning page itself from being embedded in an iframe.
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
