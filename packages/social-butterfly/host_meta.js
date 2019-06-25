import { buildUrl } from './util/url_factory';

export default function hostMeta(req, res) {
  const webFingerUrl = buildUrl({ req, pathname: `/.well-known/webfinger` });

  res.type('application/xrd+xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
      <hm:Host xmlns="http://host-meta.net/xrd/1.0">${buildUrl({ req, pathname: '' })}</hm:Host>
      <Link rel="lrdd" type="application/json" template="${webFingerUrl}?account={uri}" />
      <Link rel="lrdd" type="application/xrd+xml" template="${webFingerUrl}?format=xml&account={uri}" />
    </XRD>`);
}
