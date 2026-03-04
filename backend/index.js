import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import forensicRoutes from './routes/forensicRoutes.js';
import courtRoutes from './routes/courtRoutes.js';
import suspectRoutes from './routes/suspectRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import prisma from './utils/prisma.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/forensics', forensicRoutes);
app.use('/api/court', courtRoutes);
app.use('/api/suspects', suspectRoutes);
app.use('/api/audits', auditRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'active', message: 'GuardianNet API is running.' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`GuardianNet Server is running on port ${PORT}`);
});
