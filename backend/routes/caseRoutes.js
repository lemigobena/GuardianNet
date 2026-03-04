import express from 'express';
import { createCase, getCases } from '../controllers/caseController.js';
import { protect, authorize, requireBiometric } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Converting an incident to a case requires Detective role and Biometric check
router.post('/', protect, authorize('DETECTIVE'), requireBiometric, createCase);
router.get('/', protect, authorize('DETECTIVE', 'SUPERVISOR', 'PROSECUTOR', 'JUDICIAL_ADMIN', 'SYSTEM_ADMIN'), getCases);

export default router;
