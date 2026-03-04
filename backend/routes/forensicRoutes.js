import express from 'express';
import { createReport, getReportsForCase } from '../controllers/forensicController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('FORENSIC_OFFICER'), createReport);
router.get('/case/:id', protect, getReportsForCase);

export default router;
