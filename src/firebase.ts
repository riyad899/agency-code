import admin from 'firebase-admin'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('Warning: using default JWT_SECRET. Set JWT_SECRET in production.')
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Check if we're in production (Vercel) or development
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production: Use environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } else {
    // Development: Use local JSON file
    const serviceAccount = require('./config/firebase-service-account.json')
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  }
}

export const auth = admin.auth()
export const firestore = admin.firestore()

export function signSessionToken(uid: string) {
  return jwt.sign({ uid }, JWT_SECRET, { expiresIn: '7d' })
}

// Middleware to verify Firebase ID Token sent in Authorization: Bearer <token>
export async function verifyIdTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/Bearer\s+(.*)/i)
  if (!match) return next()

  const idToken = match[1]
  try {
    const decoded = await auth.verifyIdToken(idToken, true)
    ;(req as any).firebaseUser = decoded
    return next()
  } catch (err: any) {
    if (err && (err.code === 'auth/id-token-revoked' || err.code === 'auth/token-revoked')) {
      return res.status(401).json({ error: 'Token revoked. Please reauthenticate.' })
    }
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Cookie auth middleware: verifies `session` cookie JWT and attaches `req.sessionUser`
export function cookieAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = (req as any).cookies && (req as any).cookies.session
  if (!token) return next()
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    ;(req as any).sessionUser = { uid: decoded.uid }
    return next()
  } catch (err) {
    ;(req as any).sessionUser = undefined
    return next()
  }
}

export default admin
