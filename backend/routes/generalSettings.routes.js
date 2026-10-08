import express from 'express';

const generalSettingsRouter = express.Router();

import createUploader from '../middleware/multer.middleware.js';

const upload = createUploader('generalSettings');

import {getGeneralSettings, updateGeneralSettings } from '../controllers/generalSettings.controller.js';

generalSettingsRouter.get('/', getGeneralSettings);
generalSettingsRouter.put(
  '/',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  updateGeneralSettings
);

export default generalSettingsRouter;