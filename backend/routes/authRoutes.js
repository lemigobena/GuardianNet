import express from 'express';
import { registerUser, loginUser, verifyBiometric } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/biometric', protect, verifyBiometric);

export default router;
