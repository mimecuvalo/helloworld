import { buildUrl } from './util/url_factory';
import nodemailer from 'nodemailer';

// TODO(mime): translate everything here.
async function send(req, subject, to, fromEmail, html) {
  try {
    // Setup to work with postfix currently. Tweak as necessary.
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      tls: {
        rejectUnauthorized: false,
      },
    });

    const me = `no-reply@${req.get('host')}`;
    await transporter.sendMail({
      from: `"Hello, world." <${me}>`,
      to,
      'reply-to': fromEmail?.indexOf('@') !== -1 ? fromEmail : undefined,
      subject,
      html,
    });
  } catch (ex) {
    console.log('efail', ex);
  }
}

export function comment(req, fromUsername, fromEmail, toEmail, contentUrl, comment) {
  fromEmail = fromEmail.indexOf('@') !== -1 ? fromEmail : undefined;
  send(
    req,
    `${fromUsername} made a comment on your post.`,
    toEmail,
    fromEmail,
    `<a href="${contentUrl}">View the post here.</a>`
  );
}

export function mention(req, fromUsername, fromEmail, toEmail, remoteUrl) {
  send(
    req,
    `${fromUsername} made a post mentioning you in it!`,
    toEmail,
    fromEmail,
    `<a href="${remoteUrl}">View the post here.</a>`
  );
}

export function follow(req, fromUsername, toEmail, blogUrl) {
  const followUrl = buildUrl({ req, pathname: '/api/social/follow', searchParams: { url: blogUrl } });

  send(
    req,
    `${fromUsername} started following you!`,
    toEmail,
    undefined /* fromEmail */,
    `<a href="${blogUrl}">View their blog.</a><br/>` +
      `If you like their stuff you can follow them by <a href="${followUrl}">clicking here</a>.`
  );
}
