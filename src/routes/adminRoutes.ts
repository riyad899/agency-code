import { Router } from 'express'
import { createUser, setUserRole } from '../controllers/adminController'

const router = Router()

router.post('/admin/create-user', createUser)
router.post('/admin/set-role', setUserRole)

export default router
