// routes/authRoutes.ts
import express from 'express';
import { handleRegister, handleLogin, handleConfirmRegister } from '../controllers/authController.ts';

const router = express.Router();

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/confirm-register', handleConfirmRegister);

export default router;
