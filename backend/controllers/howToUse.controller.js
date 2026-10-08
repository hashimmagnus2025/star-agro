import {
	insertHowToUse,
	getAllHowToUse,
	getHowToUseById,
	updateHowToUse,
	deleteHowToUse,
} from '../models/howToUse.model.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

const isVideo = (file) => file && (file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi)$/i.test(file.originalname));

export const createHowToUse = async (req, res) => {
	try {
		const { title, description } = req.body;
		if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
		if (!req.file) return res.status(400).json({ message: 'Video is required' });
		if (!isVideo(req.file)) return res.status(400).json({ message: 'Please upload a valid video file' });

		const video_url = await resolveUploadedFileUrl(req.file, 'how-to-use');
		const id = await insertHowToUse({ title: title.trim(), description, video_url });
		return res.status(201).json({ message: 'How-to video created successfully', id });
	} catch (error) {
		console.error('Error creating how-to video:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};

export const getHowToUse = async (req, res) => {
	try {
		return res.status(200).json(await getAllHowToUse());
	} catch (error) {
		console.error('Error fetching how-to videos:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};

export const updateHowToUseItem = async (req, res) => {
	try {
		const existing = await getHowToUseById(req.params.id);
		if (!existing) return res.status(404).json({ message: 'How-to video not found' });
		const { title, description } = req.body;
		if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
		if (req.file && !isVideo(req.file)) return res.status(400).json({ message: 'Please upload a valid video file' });

		const video_url = req.file ? await resolveUploadedFileUrl(req.file, 'how-to-use') : existing.video_url;
		await updateHowToUse(req.params.id, { title: title.trim(), description, video_url });
		return res.status(200).json({ message: 'How-to video updated successfully' });
	} catch (error) {
		console.error('Error updating how-to video:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};

export const removeHowToUse = async (req, res) => {
	try {
		const deleted = await deleteHowToUse(req.params.id);
		if (!deleted) return res.status(404).json({ message: 'How-to video not found' });
		return res.status(200).json({ message: 'How-to video deleted successfully' });
	} catch (error) {
		console.error('Error deleting how-to video:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};
