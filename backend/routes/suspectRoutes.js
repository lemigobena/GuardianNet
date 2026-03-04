import express from 'express';
import { addSuspect, getSuspectsForCase } from '../controllers/suspectController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('DETECTIVE', 'SUPERVISOR'), addSuspect);
router.get('/case/:id', protect, authorize('DETECTIVE', 'SUPERVISOR', 'PROSECUTOR'), getSuspectsForCase);

export default router;
