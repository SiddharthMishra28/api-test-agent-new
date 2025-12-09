import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { mainAgent } from './agents/mainAgent';
import { logger } from './utils/logger';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Setup file storage for OpenAPI specs
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Endpoint to upload OpenAPI spec
app.post('/upload-spec', upload.single('spec'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  logger.info('Spec file uploaded', { file: req.file.filename });
  res.status(200).json({ specId: req.file.filename });
});

// Endpoint to run a test
app.post('/run-test', async (req, res) => {
  const { instruction, specId } = req.body;
  if (!instruction) {
    return res.status(400).send('Instruction is required.');
  }

  let specContent: string | undefined;
  if (specId) {
    const specPath = path.join(uploadDir, specId);
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8');
    } else {
      return res.status(404).send('Spec ID not found.');
    }
  }

  try {
    const { report, reportPath } = await mainAgent(instruction, specContent);
    res.status(200).json({ report, reportPath });
  } catch (error: any) {
    logger.error('Error running test', { error: error.message });
    res.status(500).send('Failed to run test.');
  }
});

// Endpoint to get a report
app.get('/report/:runId', (req, res) => {
  const { runId } = req.params;
  const reportPath = path.join(__dirname, '..', 'reports', runId);

  if (fs.existsSync(reportPath)) {
    res.sendFile(reportPath);
  } else {
    res.status(404).send('Report not found.');
  }
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

export { app };
