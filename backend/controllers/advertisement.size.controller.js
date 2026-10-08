import { deleteAdvertisementSize, getAdvertisementSizeById, getAllAdvertisementSizes, insertAdvertisementSize, isAdvertisementSizeInUse, updateAdvertisementSize } from '../models/advertisement.size.model.js';

const parseSize = (value) => {
	const number = Number(value);
	return Number.isInteger(number) && number > 0 ? number : null;
};

const validatePayload = ({ width, height, type, status }) => {
	const parsedWidth = parseSize(width);
	const parsedHeight = parseSize(height);
	if (!parsedWidth || !parsedHeight) return { message: 'Width and height must be positive whole numbers' };
	if (type !== 'Horizontal' && type !== 'Vertical') return { message: 'Type must be Horizontal or Vertical' };
	if (status !== 'Active' && status !== 'Inactive') return { message: 'Status must be Active or Inactive' };
	return { width: parsedWidth, height: parsedHeight, type, status };
};

export const getAdvertisementSizes = async (req, res) => {
	try { return res.status(200).json(await getAllAdvertisementSizes()); }
	catch (error) { console.error('Error fetching advertisement sizes:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const createAdvertisementSize = async (req, res) => {
	try {
		const payload = validatePayload({ ...req.body, type: req.body.type || 'Horizontal', status: req.body.status || 'Active' });
		if (payload.message) return res.status(400).json(payload);
		const id = await insertAdvertisementSize(payload);
		return res.status(201).json({ message: 'Advertisement size created successfully', id });
	} catch (error) { console.error('Error creating advertisement size:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const updateAdvertisementSizeController = async (req, res) => {
	try {
		const existing = await getAdvertisementSizeById(req.params.id);
		if (!existing) return res.status(404).json({ message: 'Advertisement size not found' });
		const payload = validatePayload({ ...req.body, type: req.body.type || existing.type, status: req.body.status || existing.status });
		if (payload.message) return res.status(400).json(payload);
		await updateAdvertisementSize(req.params.id, payload);
		return res.status(200).json({ message: 'Advertisement size updated successfully' });
	} catch (error) { console.error('Error updating advertisement size:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const deleteAdvertisementSizeController = async (req, res) => {
	try {
		const existing = await getAdvertisementSizeById(req.params.id);
		if (!existing) return res.status(404).json({ message: 'Advertisement size not found' });
		if (await isAdvertisementSizeInUse(req.params.id)) {
			return res.status(400).json({ message: 'This size is used by existing advertisements or prices. Mark it Inactive instead of deleting, or remove those first.' });
		}
		await deleteAdvertisementSize(req.params.id);
		return res.status(200).json({ message: 'Advertisement size deleted successfully' });
	} catch (error) { console.error('Error deleting advertisement size:', error); return res.status(500).json({ message: 'Internal server error' }); }
};
