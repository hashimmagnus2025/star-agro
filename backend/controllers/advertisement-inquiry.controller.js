import {
  insertAdvertisementInquiry,
  getAllAdvertisementInquiries,
  getAdvertisementInquiryById,
} from '../models/advertisement-inquiry.model.js';

export const saveAdvertisementInquiry = async (req, res) => {
  try {
    const { name, email, phone, selectedSize, message } = req.body;

    if (!name || !email || !selectedSize) {
      return res.status(400).json({ message: 'Name, email and selected size are required' });
    }

    const result = await insertAdvertisementInquiry({ name, email, phone, selectedSize, message });

    return res.status(201).json({
      message: 'Advertisement inquiry submitted successfully',
      id: result.insertId,
      data: { id: result.insertId, name, email, phone: phone || null, selectedSize, message: message || null },
    });
  } catch (error) {
    console.error('Error saving advertisement inquiry:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdvertisementInquiries = async (req, res) => {
  try {
    const items = await getAllAdvertisementInquiries();
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching advertisement inquiries:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdvertisementInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getAdvertisementInquiryById(id);
    if (!item) {
      return res.status(404).json({ message: 'Advertisement inquiry not found' });
    }
    return res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching advertisement inquiry:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
