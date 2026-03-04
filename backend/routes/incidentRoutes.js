import express from 'express';
import { createIncident, getIncidents } from '../controllers/incidentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('CITIZEN', 'PATROL_OFFICER'), createIncident);
router.get('/', protect, getIncidents);

export default router;
