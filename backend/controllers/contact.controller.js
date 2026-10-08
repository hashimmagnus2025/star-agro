import {
  insertContactMessage,
  getAllContactMessages,
  getContactMessageById,
} from '../models/contact.model.js';

export const saveContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const result = await insertContactMessage({ name, email, phone, subject, message });

    return res.status(201).json({
      message: 'Contact message saved successfully',
      id: result.insertId,
      data: { id: result.insertId, name, email, phone: phone || null, subject: subject || null, message },
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getContactMessages = async (req, res) => {
  try {
    const items = await getAllContactMessages();
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getContactMessageById(id);
    if (!item) {
      return res.status(404).json({ message: 'Contact message not found' });
    }
    return res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
