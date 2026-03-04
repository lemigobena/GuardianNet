import express from 'express';
import { uploadEvidence, getEvidenceForCase } from '../controllers/evidenceController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { uploadAction } from '../utils/cloudinary.js';

const router = express.Router();

router.post('/', protect, authorize('DETECTIVE', 'FORENSIC_OFFICER'), uploadAction.single('file'), uploadEvidence);
router.get('/case/:id', protect, authorize('DETECTIVE', 'PROSECUTOR', 'JUDICIAL_ADMIN', 'SUPERVISOR'), getEvidenceForCase);

export default router;
