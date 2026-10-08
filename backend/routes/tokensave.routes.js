import express from 'express';
import { saveToken } from '../controllers/tokensave.controller.js';

const router = express.Router();

router.post('/', saveToken);

export default router;
