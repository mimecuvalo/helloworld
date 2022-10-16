export class HTTPError extends Error {
  constructor(status: number, url: string, opt_info?: string) {
    super(status.toString());

    opt_info = opt_info || '';
    this.name = `${status}: ${url} ${opt_info}`;
  }
}
