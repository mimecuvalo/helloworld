export class HTTPError extends Error {
  constructor(status, url, opt_info) {
    super(status.toString());

    opt_info = opt_info || '';
    this.name = `${status}: ${url} ${opt_info}`;
  }
}
