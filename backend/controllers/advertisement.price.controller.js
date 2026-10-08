import {
	deleteAdvertisementPrice,
	findDuplicateAdvertisementPrice,
	getAdvertisementPriceById,
	getAllAdvertisementPrices,
	insertAdvertisementPrice,
	updateAdvertisementPrice,
} from '../models/advertisement.price.model.js';
import { getAdvertisementSizeById } from '../models/advertisement.size.model.js';
import { getAdvertisementDurationById } from '../models/advertisement.duration.model.js';

const validatePayload = async ({ adSizeId, adDurationId, price, status }) => {
	const parsedPrice = Number(price);
	if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return { message: 'Price must be zero or a positive number' };
	if (status !== 'Active' && status !== 'Inactive') return { message: 'Status must be Active or Inactive' };
	if (!(await getAdvertisementSizeById(adSizeId))) return { message: 'Please select a valid advertisement size' };
	if (!(await getAdvertisementDurationById(adDurationId))) return { message: 'Please select a valid advertisement duration' };
	return { adSizeId, adDurationId, price: parsedPrice, status };
};

export const getAdvertisementPrices = async (req, res) => {
	try { return res.status(200).json(await getAllAdvertisementPrices()); }
	catch (error) { console.error('Error fetching advertisement prices:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const createAdvertisementPrice = async (req, res) => {
	try {
		const payload = await validatePayload({ ...req.body, status: req.body.status || 'Active' });
		if (payload.message) return res.status(400).json(payload);
		if (await findDuplicateAdvertisementPrice(payload.adSizeId, payload.adDurationId)) {
			return res.status(400).json({ message: 'A price already exists for this size and duration combination' });
		}
		const id = await insertAdvertisementPrice(payload);
		return res.status(201).json({ message: 'Advertisement price created successfully', id });
	} catch (error) { console.error('Error creating advertisement price:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const updateAdvertisementPriceController = async (req, res) => {
	try {
		const existing = await getAdvertisementPriceById(req.params.id);
		if (!existing) return res.status(404).json({ message: 'Advertisement price not found' });
		const payload = await validatePayload({ ...req.body, status: req.body.status || existing.status });
		if (payload.message) return res.status(400).json(payload);
		if (await findDuplicateAdvertisementPrice(payload.adSizeId, payload.adDurationId, req.params.id)) {
			return res.status(400).json({ message: 'A price already exists for this size and duration combination' });
		}
		await updateAdvertisementPrice(req.params.id, payload);
		return res.status(200).json({ message: 'Advertisement price updated successfully' });
	} catch (error) { console.error('Error updating advertisement price:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const deleteAdvertisementPriceController = async (req, res) => {
	try {
		const existing = await getAdvertisementPriceById(req.params.id);
		if (!existing) return res.status(404).json({ message: 'Advertisement price not found' });
		await deleteAdvertisementPrice(req.params.id);
		return res.status(200).json({ message: 'Advertisement price deleted successfully' });
	} catch (error) { console.error('Error deleting advertisement price:', error); return res.status(500).json({ message: 'Internal server error' }); }
};
