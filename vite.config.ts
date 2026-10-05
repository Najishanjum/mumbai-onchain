import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Local development middleware to handle /api/x/profile without exposing X_BEARER_TOKEN
function xProfileDevPlugin(token: string) {
  const localCache = new Map<string, { profile: any; expiry: number }>();
  const TTL = 15 * 60 * 1000;

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
        if (!bearer) {
          res.statusCode = 500;
          res.end(JSON.stringify({
            error: 'X_BEARER_TOKEN is not configured in .env.local on the dev server.'
          }));
          return;
        }

        try {
          const xUrl = `https://api.x.com/2/users/by/username/${encodeURIComponent(cleanUsername)}?user.fields=id,name,username,profile_image_url,description,location,url`;
          const xRes = await fetch(xUrl, {
            headers: {
              Authorization: `Bearer ${bearer}`,
              Accept: 'application/json'
            }
          });

          if (xRes.status === 404) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'X profile not found.' }));
            return;
          }

          if (xRes.status === 429) {
            res.statusCode = 429;
            res.end(JSON.stringify({ error: 'Too many requests. Please try again shortly.' }));
            return;
          }

          if (!xRes.ok) {
            res.statusCode = xRes.status;
            res.end(JSON.stringify({ error: 'We could not access X right now. Please try again.' }));
            return;
          }

          const data = (await xRes.json()) as any;
          if (!data?.data) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'X profile not found.' }));
            return;
          }

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
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Unable to connect to X at this moment.' }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const bearerToken = env.X_BEARER_TOKEN || process.env.X_BEARER_TOKEN || '';

  return {
    plugins: [
      react(),
      xProfileDevPlugin(bearerToken)
    ]
  };
});
