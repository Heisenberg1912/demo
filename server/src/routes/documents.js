import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const agreementPath = path.resolve(__dirname, '..', '..', '..', 'Builtattic_Demo_Agreement.docx');

router.get('/builtattic-demo-agreement', (req, res, next) => {
  fs.access(agreementPath, fs.constants.R_OK, (error) => {
    if (error) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    res.sendFile(agreementPath, (err) => {
      if (err) {
        next(err);
      }
    });
  });
});

export default router;
