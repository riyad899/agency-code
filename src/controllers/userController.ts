import { Request, Response } from 'express'
import { getUsersCollection } from '../db'
import { auth } from '../firebase'

/**
 * Check if request is authenticated
 * (Firebase ID token OR cookie session)
 */
function isAuthenticated(req: Request) {
  return Boolean((req as any).firebaseUser || (req as any).sessionUser)
}

/**
 * Check if logged-in user owns the resource
 */
function isOwner(req: Request, uid: string) {
  const firebaseUser = (req as any).firebaseUser
  const sessionUser = (req as any).sessionUser

  return (
    (firebaseUser && firebaseUser.uid === uid) ||
    (sessionUser && sessionUser.uid === uid)
  )
}

/**
 * GET /api/users/:uid
 * Owner only - requires authentication
 */
export async function getUser(req: Request, res: Response) {
  const uid = req.params.uid
  if (!uid) return res.status(400).json({ error: 'uid required' })

  // Check if authenticated
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access user data',
      code: 'NOT_AUTHENTICATED'
    })
  }

  // Check if user owns this resource
  if (!isOwner(req, uid as string)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own user data',
      code: 'ACCESS_DENIED'
    })
  }

  try {
    const user = await getUsersCollection().findOne({ firebaseUid: uid })
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json(user)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

/**
 * GET /api/users
 * Any authenticated user
 */
export async function listUsers(req: Request, res: Response) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const users = await getUsersCollection()
      .find()
      .project({ firebaseUid: 1, email: 1, displayName: 1, photoURL: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return res.json(users)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

/**
 * PUT /api/users/:uid
 * Owner only
 */
export async function updateUser(req: Request, res: Response) {
  const uid = req.params.uid
  if (!uid) return res.status(400).json({ error: 'uid required' })

  if (!isOwner(req, uid as string)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { email, displayName, phoneNumber, photoURL, password } = req.body

  try {
    // Update Firebase Auth
    const updatePayload: any = {}
    if (email) updatePayload.email = email
    if (displayName) updatePayload.displayName = displayName
    if (phoneNumber) updatePayload.phoneNumber = phoneNumber
    if (photoURL) updatePayload.photoURL = photoURL

    // ⚠️ Password change allowed ONLY for owner
    if (password) updatePayload.password = password

    if (Object.keys(updatePayload).length > 0) {
      await auth.updateUser(uid as string, updatePayload)
    }

    // Update MongoDB profile
    await getUsersCollection().updateOne(
      { firebaseUid: uid },
      { $set: { email, displayName, phoneNumber, photoURL, updatedAt: new Date() } },
      { upsert: true }
    )

    const updated = await getUsersCollection().findOne({ firebaseUid: uid })
    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

/**
 * DELETE /api/users/:uid
 * Owner only
 */
export async function deleteUser(req: Request, res: Response) {
  const uid = req.params.uid
  if (!uid) return res.status(400).json({ error: 'uid required' })

  if (!isOwner(req, uid as string)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    // Delete from Firebase
    await auth.deleteUser(uid as string)

    // Delete from MongoDB
    await getUsersCollection().deleteOne({ firebaseUid: uid })

    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
