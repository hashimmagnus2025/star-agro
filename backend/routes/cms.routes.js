import express from 'express';
import {
  createContent,
  getCmsContentList,
  getCmsPageContent,
  getCmsContent,
  updateContent,
  deleteContent,
} from '../controllers/cms.controller.js';

import createUploader from '../middleware/multer.middleware.js';
const upload = createUploader('cms');
const CmsRouter = express.Router();

CmsRouter.post('/', upload.single('image'), createContent);
CmsRouter.get('/', getCmsContentList);
CmsRouter.get('/page/:page', getCmsPageContent);
CmsRouter.get('/:id', getCmsContent);
CmsRouter.put('/:id',upload.single('image'), updateContent);
CmsRouter.delete('/:id', deleteContent);

export default CmsRouter;
