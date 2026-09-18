// Query-parameter key the Axeptio web widget reads to adopt a shared consent
// token (see widget-client Token.tsx). Mirrors the native SDK helpers
// appendAxeptioTokenToURL (iOS) / appendAxeptioToken (Android).
//
// NOTE: this carries the *user consent token* from GET /mobile/token — never
// the Bearer API token, which must never appear in a URL.
const AXEPTIO_TOKEN_PARAM = 'axeptio_token';

// Append (or replace) ?axeptio_token=<token> on a URL, preserving existing
// query params. Idempotent: calling twice does not duplicate the param.
// Returns the original url unchanged if url or token is missing.
const appendAxeptioToken = (url, token) => {
  if (!url || !token) return url;
  const [base, hash = ''] = url.split('#');
  const [path, query = ''] = base.split('?');
  const params = query
    .split('&')
    .filter(part => part && part.split('=')[0] !== AXEPTIO_TOKEN_PARAM);
  params.push(`${AXEPTIO_TOKEN_PARAM}=${encodeURIComponent(token)}`);
  const rebuilt = `${path}?${params.join('&')}`;
  return hash ? `${rebuilt}#${hash}` : rebuilt;
};

module.exports = { AXEPTIO_TOKEN_PARAM, appendAxeptioToken };
