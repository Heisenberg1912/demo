import { Router } from 'express';
import { createAccessRequest } from '../controllers/accessRequestController.js';

const router = Router();

router.post('/', createAccessRequest);

export default router;
