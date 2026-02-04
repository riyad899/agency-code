import dotenv from 'dotenv'

// Load environment variables FIRST before any other imports
dotenv.config()

import express, { Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { verifyIdTokenMiddleware, cookieAuthMiddleware } from './firebase'
import { connectDb } from './db'
import { connectDB } from './config/db'
import { registerRoutes } from './routes'

const app = express()

// CORS configuration for Next.js client
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-admin-secret',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))

// Security headers - Completely disable COOP for popup authentication
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
})

app.use(express.json())
app.use(cookieParser())

const PORT = process.env.PORT || 4000

// Initialize both database connections
connectDb().catch((err) => {
  console.error('Failed to connect to MongoDB (Mongoose)', err)
})

connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB (Native Driver)', err)
})

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Apply Firebase ID token verification middleware
app.use(verifyIdTokenMiddleware)

// Apply cookie session middleware (must be before routes that need it)
app.use(cookieAuthMiddleware)

// Register all application routes
registerRoutes(app)

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.send('Express + TypeScript server')
})

// Start server
app.listen(Number(PORT), () => {
  console.log(`Server running on http://localhost:${PORT}`)
})