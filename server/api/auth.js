import express from 'express';
import fetch from 'node-fetch';

/**
 * Routes for letting the user login / logout.
 */

const router = express.Router();
router.get('/callback', async (req, res) => {
  try {
    const hostWithPort = req.get('host');
    const redirectUri = `${req.protocol}://${hostWithPort}/api/auth/callback`;
    const tokenResponse = await fetch(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
        client_secret: process.env.REACT_APP_AUTH0_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: req.query.code,
        grant_type: 'authorization_code',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const tokenInfo = await tokenResponse.json();
    const accessToken = tokenInfo['access_token'];
    const userResponse = await fetch(
      `https://${process.env.REACT_APP_AUTH0_DOMAIN}/userinfo?access_token=${accessToken}`
    );
    const userInfo = await userResponse.json();

    req.session.user = userInfo;

    res.redirect(req.query.next || '/');
    return;
  } catch (ex) {
    console.error('Could not log user in.');
    res.redirect('/');
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('connect.sid');

  req.session.destroy(() => {
    res.redirect(req.query.next || '/');
  });
});

export default router;
