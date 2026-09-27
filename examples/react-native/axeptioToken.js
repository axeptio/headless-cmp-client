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
  // Split on the FIRST delimiter only. A destructured `split('#')`/`split('?')`
  // silently drops everything after a second one, which a URL legitimately has
  // when a query value is itself a URL (?returnTo=https://x/y?step=1).
  const hashAt = url.indexOf('#');
  const base = hashAt === -1 ? url : url.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : url.slice(hashAt + 1);
  const queryAt = base.indexOf('?');
  const path = queryAt === -1 ? base : base.slice(0, queryAt);
  const query = queryAt === -1 ? '' : base.slice(queryAt + 1);
  const params = query
    .split('&')
    .filter(part => part && part.split('=')[0] !== AXEPTIO_TOKEN_PARAM);
  params.push(`${AXEPTIO_TOKEN_PARAM}=${encodeURIComponent(token)}`);
  const rebuilt = `${path}?${params.join('&')}`;
  return hash ? `${rebuilt}#${hash}` : rebuilt;
};

module.exports = { AXEPTIO_TOKEN_PARAM, appendAxeptioToken };
