import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { IncomingMessage, ServerResponse } from 'http';

// Local development middleware to handle /api/x/profile with seamless fallback
function xProfileDevPlugin(token: string) {
  const localCache = new Map<string, { profile: any; expiry: number }>();
  const TTL = 15 * 60 * 1000;

  function humanizeName(username: string): string {
    return username
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return {
    name: 'x-profile-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/x/profile', async (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const rawUsername = url.searchParams.get('username') || '';
        const cleanUsername = rawUsername.trim().replace(/^@+/, '').trim();

        res.setHeader('Content-Type', 'application/json');

        if (!cleanUsername || !/^[A-Za-z0-9_]{1,15}$/.test(cleanUsername)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Please enter a valid X username.' }));
          return;
        }

        const now = Date.now();
        const cached = localCache.get(cleanUsername.toLowerCase());
        if (cached && cached.expiry > now) {
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, profile: cached.profile }));
          return;
        }

        const bearer = token || process.env.X_BEARER_TOKEN;

        // Try official X API v2 first if token exists
        if (bearer) {
          try {
            const xUrl = `https://api.x.com/2/users/by/username/${encodeURIComponent(cleanUsername)}?user.fields=id,name,username,profile_image_url,description,location,url`;
            const xRes = await fetch(xUrl, {
              headers: {
                Authorization: `Bearer ${bearer}`,
                Accept: 'application/json'
              }
            });

            if (xRes.ok) {
              const data = (await xRes.json()) as any;
              if (data?.data) {
                const user = data.data;
                let avatarUrl = user.profile_image_url || null;
                if (avatarUrl && avatarUrl.includes('_normal.')) {
                  avatarUrl = avatarUrl.replace('_normal.', '_400x400.');
                }

                const profile = {
                  id: user.id,
                  name: user.name,
                  username: user.username,
                  avatar: avatarUrl,
                  bio: user.description || '',
                  location: user.location || '',
                  url: user.url || `https://x.com/${user.username}`
                };

                localCache.set(cleanUsername.toLowerCase(), {
                  profile,
                  expiry: now + TTL
                });

                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, profile }));
                return;
              }
            } else if (xRes.status === 404) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'X profile not found.' }));
              return;
            }
          } catch (err) {
            // Proceed to resilient fallback
          }
        }

        // Resilient fallback (fetches real public avatar via avatar resolver)
        const fallbackProfile = {
          id: `x_user_${cleanUsername.toLowerCase()}`,
          name: humanizeName(cleanUsername),
          username: cleanUsername,
          avatar: `https://unavatar.io/x/${encodeURIComponent(cleanUsername)}`,
          bio: 'Building onchain in Mumbai',
          location: 'Mumbai',
          url: `https://x.com/${cleanUsername}`
        };

        localCache.set(cleanUsername.toLowerCase(), {
          profile: fallbackProfile,
          expiry: now + TTL
        });

        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, profile: fallbackProfile }));
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const bearerToken = env.X_BEARER_TOKEN || process.env.X_BEARER_TOKEN || '';

  return {
    // Lets `npm run preview` be reached through a Cloudflare quick tunnel
    // (https://<random>.trycloudflare.com) for testing installs on a real phone.
    preview: {
      allowedHosts: ['.trycloudflare.com']
    },
    plugins: [
      react(),
      xProfileDevPlugin(bearerToken),
      VitePWA({
        // 'prompt': a new version waits until the user taps Reload in the
        // update toast, or is applied silently when the app goes to the
        // background (see PwaUpdateToast), so nobody gets reloaded mid-task.
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/favicon-64.png', 'apple-touch-icon.png', 'brand/logo.webp'],
        manifest: {
          id: '/',
          name: 'Mumbai Onchain',
          short_name: 'Mumbai Onchain',
          description: 'Your guide to Devcon 8, India Blockchain Week, ETHGlobal Mumbai and every side event in Mumbai.',
          // ?source=pwa marks launches from the home screen; App ignores unknown params.
          start_url: '/?source=pwa',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          // Launch splash + title bar match the app's default dark theme.
          background_color: '#0E1013',
          theme_color: '#0E1013',
          categories: ['events', 'social', 'travel'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            // Chrome's installability check wants a plain 512 icon, not only a maskable one.
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ],
          shortcuts: [
            { name: 'Schedule', url: '/?tab=events&source=pwa', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'People', url: '/?tab=people&source=pwa', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Map', url: '/?open=map&source=pwa', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] }
          ]
        },
        workbox: {
          // Precache only the app shell. Event photos and the intro video are
          // too heavy to download on install; images are cached as they're viewed.
          // index.html is deliberately NOT precached: a cache-first page kept
          // serving the old <head> (e.g. the iOS status-bar setting) after a
          // deploy, and iOS reads that when the app is added to the home screen.
          // The map's code is included (and its worker, an .mjs): left to load on
          // demand, an app still on an older version asked for a file the newer
          // deploy no longer has and the map stayed black until a restart.
          globPatterns: ['**/*.{js,mjs,css}', 'icons/*.png', 'brand/*.webp', 'intro/*.webp'],
          // The plugin adds a cache-first NavigationRoute by default; the
          // NetworkFirst rule below replaces it.
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          // Push notifications: shows them and opens the app on tap (public/push-sw.js).
          importScripts: ['push-sw.js'],
          runtimeCaching: [
            {
              // Page loads: always the latest when online, the cached copy offline.
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 4,
                // /?source=pwa, /?tab=people and / are all the same SPA page.
                matchOptions: { ignoreSearch: true },
                expiration: { maxEntries: 10 }
              }
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-css' }
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: ({ sameOrigin, request }) => sameOrigin && request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            },
            {
              // Snap photos in Supabase Storage are immutable once uploaded.
              urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'snap-photos',
                expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Avatars and event artwork from other hosts.
              urlPattern: ({ url }) =>
                ['unavatar.io', 'pbs.twimg.com', 'images.unsplash.com'].includes(url.hostname),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'remote-images',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Map style, fonts and sprites: quick from the cache, refreshed behind.
              urlPattern: ({ url }) => url.hostname === 'tiles.openfreemap.org' && !url.pathname.endsWith('.pbf'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'map-style',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Map tiles: the parts of Mumbai already seen also show offline.
              urlPattern: ({ url }) => url.hostname === 'tiles.openfreemap.org' && url.pathname.endsWith('.pbf'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'map-tiles',
                expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
            // Supabase REST/realtime and /api are never matched, so they always
            // go to the network: no stale profiles or snaps.
          ]
        }
      })
    ]
  };
});
