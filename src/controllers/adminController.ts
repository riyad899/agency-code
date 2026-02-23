import { Request, Response } from 'express'
import { auth } from '../firebase'
import { getUsersCollection } from '../db'

/**
 * POST /api/admin/set-role
 * Admin-only endpoint to set user role (admin or user)
 */
export async function setUserRole(req: Request, res: Response) {
  const adminSecretEnv = process.env.ADMIN_SECRET
  const headerSecret = (req.headers['x-admin-secret'] as string) || undefined

  console.log('🔐 Set Role Request:');
  console.log('  Admin Secret from ENV:', adminSecretEnv ? '✓ Set' : '✗ Not set');
  console.log('  Header Secret:', headerSecret ? '✓ Provided' : '✗ Not provided');
  console.log('  Secrets match:', headerSecret === adminSecretEnv);

  const firebaseUser = (req as any).firebaseUser
  console.log('  Firebase User:', firebaseUser ? `✓ ${firebaseUser.uid}` : '✗ Not authenticated');
  
  const hasAdminClaim = !!(firebaseUser && firebaseUser.admin === true)
  const hasHeaderSecret = !!(headerSecret && adminSecretEnv && headerSecret === adminSecretEnv)

  console.log('  Has Admin Claim:', hasAdminClaim);
  console.log('  Has Valid Header Secret:', hasHeaderSecret);

  if (!hasAdminClaim && !hasHeaderSecret) {
    console.log('❌ Access denied: No valid admin credentials');
    return res.status(403).json({ error: 'Forbidden: Admin access required' })
  }

  console.log('✅ Admin access granted');

  const { uid, role } = req.body
  if (!uid || !role) {
    return res.status(400).json({ error: 'uid and role required' })
  }

  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'role must be either "admin" or "user"' })
  }

  try {
    // Update Firebase custom claims
    const customClaims = role === 'admin' ? { admin: true } : { admin: false }
    await auth.setCustomUserClaims(uid, customClaims)

    // Update MongoDB role
    const result = await getUsersCollection().updateOne(
      { firebaseUid: uid },
      { 
        $set: { 
          role: role,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found in database' })
    }

    console.log(`✅ User ${uid} role set to: ${role}`)

    return res.status(200).json({ 
      success: true,
      message: `User role set to ${role}`,
      uid: uid,
      role: role
    })
  } catch (err) {
    console.error('Set user role error:', err)
    return res.status(500).json({ error: (err as Error).message })
  }
}

/**
 * POST /api/create-user
 * Admin-only endpoint to create users via Firebase Admin SDK
 */
export async function createUser(req: Request, res: Response) {
  const adminSecretEnv = process.env.ADMIN_SECRET
  const headerSecret = (req.headers['x-admin-secret'] as string) || undefined

  const firebaseUser = (req as any).firebaseUser
  const hasAdminClaim = !!(firebaseUser && firebaseUser.admin === true)
  const hasHeaderSecret = !!(headerSecret && adminSecretEnv && headerSecret === adminSecretEnv)

  if (!hasAdminClaim && !hasHeaderSecret) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { email, password, displayName, phoneNumber, photoURL, disabled, uid, customClaims } = req.body
  if (!email && !phoneNumber && !uid) {
    return res.status(400).json({ error: 'email or phoneNumber or uid required' })
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      phoneNumber,
      photoURL,
      disabled,
      uid,
    })

    if (customClaims && typeof customClaims === 'object') {
      await auth.setCustomUserClaims(userRecord.uid, customClaims)
    }

    // upsert user into MongoDB so profile is stored
    try {
      await getUsersCollection().updateOne(
        { firebaseUid: userRecord.uid },
        {
          $set: {
            firebaseUid: userRecord.uid,
            email: userRecord.email || email,
            displayName: userRecord.displayName || displayName || '',
            phoneNumber: userRecord.phoneNumber || phoneNumber || '',
            photoURL: userRecord.photoURL || photoURL || '',
            updatedAt: new Date()
          },
          $setOnInsert: {
            role: 'user',
            status: 'active',
            termsAccepted: true,
            createdAt: new Date()
          }
        },
        { upsert: true }
      )
    } catch (dbErr) {
      console.error('Failed to upsert user to MongoDB on admin create:', dbErr)
    }

    return res.status(201).json({ uid: userRecord.uid, email: userRecord.email })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
