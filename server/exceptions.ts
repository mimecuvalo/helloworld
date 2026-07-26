export class HTTPError extends Error {
  readonly status: number;
  readonly url?: string;

  constructor(status: number, url?: string, opt_info?: string) {
    super([status, url, opt_info].filter(Boolean).join(' '));
    this.name = 'HTTPError';
    this.status = status;
    this.url = url;
  }
}
