import {
	insertGalleryItem,
	getAllGalleryItems,
	getGalleryItemById,
	updateGalleryItem,
	deleteGalleryItem,
} from '../models/gallery.model.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

export const createGallery = async (req, res) => {
	try {
		const { title, description } = req.body;
		if (!title?.trim()) {
			return res.status(400).json({ message: 'Title is required' });
		}
		if (!req.files?.length) {
			return res.status(400).json({ message: 'At least one image is required' });
		}

		const ids = [];
		for (const file of req.files) {
			const image = await resolveUploadedFileUrl(file, 'gallery');
			ids.push(await insertGalleryItem({ title: title.trim(), description, image }));
		}
		return res.status(201).json({ message: 'Gallery items created successfully', ids });
	} catch (error) {
		console.error('Error creating gallery item:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};

export const getGallery = async (req, res) => {
	try {
		return res.status(200).json(await getAllGalleryItems());
	} catch (error) {
		console.error('Error fetching gallery items:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};

export const updateGallery = async (req, res) => {
	try {
		const { id } = req.params;
		const existingItem = await getGalleryItemById(id);
		if (!existingItem) {
			return res.status(404).json({ message: 'Gallery item not found' });
		}

		const { title, description } = req.body;
		if (!title?.trim()) {
			return res.status(400).json({ message: 'Title is required' });
		}

		const image = req.file
			? await resolveUploadedFileUrl(req.file, 'gallery')
			: existingItem.image;
		await updateGalleryItem(id, { title: title.trim(), description, image });
		return res.status(200).json({ message: 'Gallery item updated successfully' });
	} catch (error) {
		console.error('Error updating gallery item:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};

export const removeGallery = async (req, res) => {
	try {
		const deleted = await deleteGalleryItem(req.params.id);
		if (!deleted) {
			return res.status(404).json({ message: 'Gallery item not found' });
		}
		return res.status(200).json({ message: 'Gallery item deleted successfully' });
	} catch (error) {
		console.error('Error deleting gallery item:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};
