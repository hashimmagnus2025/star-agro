import express from 'express';
import createUploader from '../middleware/multer.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { createGallery, getGallery, updateGallery, removeGallery } from '../controllers/gallery.controller.js';

const GalleryRoutes = express.Router();
const upload = createUploader('gallery');

GalleryRoutes.get('/', getGallery);
GalleryRoutes.post('/', protect, authorize('admin', 'super_admin'), upload.array('image', 30), createGallery);
GalleryRoutes.put('/:id', protect, authorize('admin', 'super_admin'), upload.single('image'), updateGallery);
GalleryRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), removeGallery);

export default GalleryRoutes;
