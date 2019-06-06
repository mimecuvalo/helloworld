import { buildUrl } from './util/url_factory';

export default function hostMeta(req, res) {
  const webfingerUrl = buildUrl({ req, pathname: `/api/social/webfinger` });

  if (req.query.resource) {
    const resourceUrl = buildUrl({ req, pathname: `/api/social/webfinger`, searchParams: { account: req.query.resource } });
    return res.redirect(resourceUrl);
  }

  // NOTE: this host-meta end-point is a pre-alpha work in progress. Don't rely on it.
  // Please follow the list at http://groups.google.com/group/webfinger
  // XXX(mime): Status.net is case-sensitive :-/
  res.type('application/xrd+xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
      <hm:Host xmlns="http://host-meta.net/xrd/1.0">${buildUrl({ req, pathname: '' })}</hm:Host>
      <Link rel="lrdd" template="${webfingerUrl}?q={uri}">
        <Title>Resource Descriptor</Title>
      </Link>
    </XRD>`);
}
