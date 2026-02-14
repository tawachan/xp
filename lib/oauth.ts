// OAuth 1.0a credentials
export interface OAuthCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

// Percent-encode per RFC 3986
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

// Generate a random nonce
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate HMAC-SHA1 signature using WebCrypto
async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Build OAuth Authorization header
export async function buildAuthHeader(
  method: string,
  url: string,
  credentials: OAuthCredentials,
  params?: Record<string, string>,
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  // Only include oauth_token when access token exists (not during request_token step)
  if (credentials.accessToken) {
    oauthParams.oauth_token = credentials.accessToken;
  }

  // Merge oauth_* params from extra params into oauthParams (they belong in the header)
  const queryParams: Record<string, string> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (k.startsWith("oauth_")) {
        oauthParams[k] = v;
      } else {
        queryParams[k] = v;
      }
    }
  }

  // Combine OAuth params with query params for signature (NOT JSON body)
  const allParams: Record<string, string> = { ...oauthParams, ...queryParams };

  // Sort and encode params
  const sortedParams = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k]!)}`)
    .join("&");

  // Build signature base string
  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join("&");

  // Build signing key
  const signingKey = `${percentEncode(credentials.apiSecret)}&${percentEncode(credentials.accessTokenSecret)}`;

  // Generate signature
  const signature = await hmacSha1(signingKey, baseString);
  oauthParams["oauth_signature"] = signature;

  // Build Authorization header
  const authHeader = "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k]!)}"`)
      .join(", ");

  return authHeader;
}
