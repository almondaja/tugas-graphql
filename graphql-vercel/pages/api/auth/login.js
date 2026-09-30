import crypto from 'crypto';

export default function handler(req, res) {
  // state disimpan di cookie (Vercel serverless = stateless, jadi nggak bisa pakai memori)
  const state = crypto.randomBytes(16).toString('hex');
  res.setHeader(
    'Set-Cookie',
    `oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`
  );

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.CALLBACK_URL,
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
