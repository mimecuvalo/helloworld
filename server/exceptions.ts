export class HTTPError extends Error {
  constructor(status: number, url?: string, opt_info?: string) {
    super(status.toString());
    this.name = `${status}: ${url} ${opt_info || ''}`;
  }
}
