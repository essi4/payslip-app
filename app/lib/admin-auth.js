const COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

// Small dependency-free SHA-256 implementation so this helper works in
// Next.js Middleware (Edge runtime) as well as Node.js Route Handlers.
function sha256(input) {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const bytes = Array.from(unescape(encodeURIComponent(input)), c => c.charCodeAt(0));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push((bitLen / 2 ** (i * 8)) & 0xff);

  const rotr = (x,n) => (x >>> n) | (x << (32-n));
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w = new Array(64);
    for (let i=0;i<16;i++) w[i] = ((bytes[offset+i*4]<<24)|(bytes[offset+i*4+1]<<16)|(bytes[offset+i*4+2]<<8)|bytes[offset+i*4+3]) >>> 0;
    for (let i=16;i<64;i++) {
      const s0 = rotr(w[i-15],7)^rotr(w[i-15],18)^(w[i-15]>>>3);
      const s1 = rotr(w[i-2],17)^rotr(w[i-2],19)^(w[i-2]>>>10);
      w[i] = (w[i-16]+s0+w[i-7]+s1) >>> 0;
    }
    let [a,b,c,d,e,f,g,h] = H;
    for (let i=0;i<64;i++) {
      const S1 = rotr(e,6)^rotr(e,11)^rotr(e,25);
      const ch = (e&f)^(~e&g);
      const t1 = (h+S1+ch+K[i]+w[i]) >>> 0;
      const S0 = rotr(a,2)^rotr(a,13)^rotr(a,22);
      const maj = (a&b)^(a&c)^(b&c);
      const t2 = (S0+maj) >>> 0;
      h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
  }
  return H.map(x => x.toString(16).padStart(8,"0")).join("");
}

function hmacSha256(message, secret) {
  let key = unescape(encodeURIComponent(secret));
  if (key.length > 64) key = unescape(encodeURIComponent(sha256(secret)));
  key = key.padEnd(64, "\0");
  let inner = "", outer = "";
  for (let i=0;i<64;i++) {
    const c = key.charCodeAt(i);
    inner += String.fromCharCode(c ^ 0x36);
    outer += String.fromCharCode(c ^ 0x5c);
  }
  return sha256(outer + unescape(encodeURIComponent(sha256(inner + message))));
}

function encodePayload(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodePayload(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===";
  return JSON.parse(decodeURIComponent(escape(atob(padded))));
}

function sign(payload) {
  return hmacSha256(payload, getSecret());
}

export function createAdminSession() {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");

  const payload = encodePayload({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });

  return `${payload}.${sign(payload)}`;
}

export function isAdminAuthenticated(request) {
  const secret = getSecret();
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  try {
    const expected = sign(payload);
    if (signature.length !== expected.length || signature !== expected) return false;
    const data = decodePayload(payload);
    return Number.isFinite(data.exp) && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function requireAdmin(request) {
  if (isAdminAuthenticated(request)) return null;
  return Response.json(
    { success: false, error: "دسترسی غیرمجاز است." },
    { status: 401 }
  );
}

export { COOKIE_NAME, SESSION_TTL_SECONDS };