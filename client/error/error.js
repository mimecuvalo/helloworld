import { buildUrl } from '../../shared/util/url_factory';
import configuration from '../app/configuration';

export function logError(data) {
  fetch(buildUrl({ pathname: '/api/report-error' }), {
    method: 'POST',
    body: JSON.stringify({
      data,
      _csrf: configuration.csrf,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
