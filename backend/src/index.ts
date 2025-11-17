/**
 * MCA Backend Server
 * Metacognitive Collaborative Agent - Core Services
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import PatternRecognitionEngine from './services/core/PatternRecognitionEngine';
import TrustCalibrationService from './services/core/TrustCalibrationService';
import SkillMonitoringService from './services/core/SkillMonitoringService';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const patternEngine = new PatternRecognitionEngine();
const trustService = new TrustCalibrationService();
const skillService = new SkillMonitoringService();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Pattern Recognition API
app.post('/api/analyze-pattern', (req: Request, res: Response) => {
  try {
    const analysis = patternEngine.analyzeUserBehavior(req.body);
    res.json(analysis);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Trust Calibration API
app.post('/api/calculate-trust', (req: Request, res: Response) => {
  try {
    const trustScore = trustService.calculateTrustScore(req.body);
    res.json(trustScore);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Skill Monitoring API
app.post('/api/register-baseline', (req: Request, res: Response) => {
  try {
    skillService.registerBaseline({
      ...req.body,
      timestamp: new Date(req.body.timestamp)
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post('/api/record-session', (req: Request, res: Response) => {
  try {
    const profile = skillService.recordSession({
      ...req.body,
      timestamp: new Date(req.body.timestamp)
    });
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Export for testing
export default app;

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MCA Backend running on port ${PORT}`);
  });
}
