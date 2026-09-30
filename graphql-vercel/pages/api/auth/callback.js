import { signToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;

    const cookieState = (req.headers.cookie || '')
      .split('; ')
      .find((c) => c.startsWith('oauth_state='))
      ?.split('=')[1];

    if (!code) {
      return res.status(400).json({ error: 'code tidak ada' });
    }
    if (!state || state !== cookieState) {
      return res.status(400).json({ error: 'state tidak valid' });
    }

    // Tukar code -> access token (di server, karena butuh client_secret)
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.CALLBACK_URL,
      }),
    });

    const { access_token, error } = await tokenRes.json();
    if (!access_token) {
      return res.status(401).json({ error: error || 'gagal menukar code' });
    }

    // Ambil profil GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'User-Agent': 'lab-oauth2',
      },
    });
    const githubUser = await userRes.json();

    // Terbitkan JWT sendiri
    const token = signToken(githubUser.login);

    res.status(200).json({ token }); // salin token ini ke Apollo Sandbox
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OAuth gagal' });
  }
}
