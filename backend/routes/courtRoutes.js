import express from 'express';
import { createCourtRecord, getCourtRecords } from '../controllers/courtController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('JUDICIAL_ADMIN'), createCourtRecord);
router.get('/', protect, authorize('JUDICIAL_ADMIN', 'PROSECUTOR', 'SUPERVISOR', 'DETECTIVE'), getCourtRecords);

export default router;
