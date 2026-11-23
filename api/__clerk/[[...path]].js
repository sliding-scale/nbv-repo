// Forwards https://nbv-admin.vercel.app/__clerk to Clerk, including the bare path.
// vercel.app cannot use Clerk DNS, so production sign-in goes through this path.
// CLERK_SECRET_KEY stays on the server. It is not a VITE_ variable.

export const config = { api: { bodyParser: false } }

const FRONTEND_API = 'https://frontend-api.clerk.dev'
const PROXY_URL = (process.env.CLERK_PROXY_URL || 'https://nbv-admin.vercel.app/__clerk').replace(/\/$/, '')

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) {
    res.status(500).send('CLERK_SECRET_KEY is not set')
    return
  }

  const incoming = new URL(req.url, PROXY_URL)
  const path = incoming.pathname.replace(/^\/api\/__clerk/, '').replace(/^\/__clerk/, '') || '/'
  const target = `${FRONTEND_API}${path}${incoming.search}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    if (key === 'host' || key === 'connection' || key === 'content-length') continue
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item))
    else headers.set(key, value)
  }
  headers.set('Clerk-Proxy-Url', PROXY_URL)
  headers.set('Clerk-Secret-Key', secret)
  const clientIp = req.headers['x-real-ip']
  if (typeof clientIp === 'string' && clientIp) headers.set('X-Forwarded-For', clientIp)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await readBody(req) : undefined,
    redirect: 'manual',
  })

  res.status(upstream.status)
  const cookies = typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : []
  upstream.headers.forEach((value, key) => {
    if (key === 'content-encoding' || key === 'transfer-encoding' || key === 'set-cookie') return
    if (key === 'location' && value.startsWith(FRONTEND_API)) {
      res.setHeader(key, PROXY_URL + value.slice(FRONTEND_API.length))
      return
    }
    res.setHeader(key, value)
  })
  if (cookies.length) res.setHeader('set-cookie', cookies)
  res.send(Buffer.from(await upstream.arrayBuffer()))
}
