import { deleteFaqCategory, getAllFaqCategories, getFaqCategoryById, insertFaqCategory, updateFaqCategory } from '../models/faq-categories.model.js';

const validatePayload = ({ faqcategoryname, description, status }) => {
	if (!faqcategoryname || !faqcategoryname.trim()) return { message: 'FAQ category name is required' };
	if (status !== 'Active' && status !== 'Inactive') return { message: 'Status must be Active or Inactive' };
	return { faqcategoryname: faqcategoryname.trim(), description: description || null, status };
};

export const getFaqCategories = async (req, res) => {
	try { return res.status(200).json(await getAllFaqCategories()); }
	catch (error) { console.error('Error fetching FAQ categories:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const createFaqCategory = async (req, res) => {
	try {
		const payload = validatePayload({ ...req.body, status: req.body.status || 'Active' });
		if (payload.message) return res.status(400).json(payload);
		const id = await insertFaqCategory(payload);
		return res.status(201).json({ message: 'FAQ category created successfully', id });
	} catch (error) { console.error('Error creating FAQ category:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const updateFaqCategoryController = async (req, res) => {
	try {
		const existing = await getFaqCategoryById(req.params.id);
		if (!existing) return res.status(404).json({ message: 'FAQ category not found' });
		const payload = validatePayload({ ...req.body, status: req.body.status || existing.status });
		if (payload.message) return res.status(400).json(payload);
		await updateFaqCategory(req.params.id, payload);
		return res.status(200).json({ message: 'FAQ category updated successfully' });
	} catch (error) { console.error('Error updating FAQ category:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const deleteFaqCategoryController = async (req, res) => {
	try {
		const existing = await getFaqCategoryById(req.params.id);
		if (!existing) return res.status(404).json({ message: 'FAQ category not found' });
		await deleteFaqCategory(req.params.id);
		return res.status(200).json({ message: 'FAQ category deleted successfully' });
	} catch (error) { console.error('Error deleting FAQ category:', error); return res.status(500).json({ message: 'Internal server error' }); }
};
