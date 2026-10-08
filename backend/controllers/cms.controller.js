import {
  insertCmsContent,
  getCmsContentById,
  getAllCmsContent,
  getCmsContentByPage,
  updateCmsContent,
  deleteCmsContent,
} from '../models/cms.model.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

export const createContent = async (req, res) => {
  try {
    const {
      page,
      section,
      type,
      title,
      language,
      subtitle,
      content,
      image_url,
      button_text,
      button_link,
      order_index,
      text_1,
      text_2,
      text_3,
      text_4,
      text_5,
      text_6,
    } = req.body;

    if (!page || !section || !type) {
      return res.status(400).json({ message: 'Page, section and type are required' });
    }

    const uploadedFile = req.file;
    const resolvedImageUrl = uploadedFile ? await resolveUploadedFileUrl(uploadedFile, 'cms') : image_url || null;

    const newContent = {
      page,
      section,
      type,
      title: title || null,
      language: language || 'en',
      subtitle: subtitle || null,
      content: content || null,
      image_url: resolvedImageUrl,
      button_text: button_text || null,
      button_link: button_link || null,
      order_index: Number(order_index) || 0,
      text_1: text_1 || null,
      text_2: text_2 || null,
      text_3: text_3 || null,
      text_4: text_4 || null,
      text_5: text_5 || null,
      text_6: text_6 || null,
    };

    const result = await insertCmsContent(newContent);
    res.status(201).json({
      message: 'CMS content created successfully',
      id: result.insertId,
      content: { id: result.insertId, ...newContent },
    });
  } catch (error) {
    console.error('Error creating CMS content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCmsContentList = async (req, res) => {
  try {
    const items = await getAllCmsContent();
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching CMS content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCmsPageContent = async (req, res) => {
  try {
    const { page } = req.params;
    const { language } = req.query;
    const items = await getCmsContentByPage(
      page,
      language || 'en'
    );

    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching page content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCmsContent = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getCmsContentById(id);
    if (!item) {
      return res.status(404).json({ message: 'CMS content not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching CMS content by id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page,
      section,
      type,
      title,
      subtitle,
      content,
      image_url,
      button_text,
      button_link,
      order_index,
      text_1,
      text_2,
      text_3,
      text_4,
      text_5,
      text_6,
    } = req.body;

    if (!page || !section || !type) {
      return res.status(400).json({ message: 'Page, section and type are required' });
    }

    const uploadedFile = req.file;
    const resolvedImageUrl = uploadedFile ? await resolveUploadedFileUrl(uploadedFile, 'cms') : image_url || null;

    const updatedContent = {
      page,
      section,
      type,
      title: title || null,
      subtitle: subtitle || null,
      content: content || null,
      image_url: resolvedImageUrl,
      button_text: button_text || null,
      button_link: button_link || null,
      order_index: Number(order_index) || 0,
      text_1: text_1 || null,
      text_2: text_2 || null,
      text_3: text_3 || null,
      text_4: text_4 || null,
      text_5: text_5 || null,
      text_6: text_6 || null,
    };

    const result = await updateCmsContent(id, updatedContent);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'CMS content not found or no changes made' });
    }
    res.status(200).json({
      message: 'CMS content updated successfully',
      content: { id, ...updatedContent },
    });
  } catch (error) {
    console.error('Error updating CMS content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCmsContent(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'CMS content not found or already deleted' });
    }
    res.status(200).json({ message: 'CMS content deleted successfully' });
  } catch (error) {
    console.error('Error deleting CMS content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
