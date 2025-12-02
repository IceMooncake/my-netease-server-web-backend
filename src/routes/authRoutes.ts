// routes/authRoutes.js
import express from 'express';
import { handleRegister, handleLogin, handleConfirmRegister } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/confirm-register', handleConfirmRegister);

export default router;
