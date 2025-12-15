import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword as any);
router.post('/reset-password', resetPassword as any);
router.get('/me', authenticateToken, getMe);

export default router;
