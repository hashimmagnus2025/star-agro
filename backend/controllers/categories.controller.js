import {
  insertCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../models/categories.model.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

export const createCategory = async (req, res) => {
  try {
    const { name, description, description_hindi,
      description_marathi, image_url, name_hindi, name_marathi } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const uploadedFile = req.file;
    const resolvedImageUrl = uploadedFile ? await resolveUploadedFileUrl(uploadedFile, 'categories') : image_url || null;

    const result = await insertCategory({
      name, name_hindi, name_marathi, description, description_hindi,
      description_marathi, image_url: resolvedImageUrl
    });
    return res.status(201).json({
      message: 'Category created successfully',
      categoryId: result.insertId,
      category: {
        id: result.insertId,
        name,
        name_hindi: name_hindi || null,
        name_marathi: name_marathi || null,
        description: description || null,
        description_hindi: description_hindi || null,
        description_marathi: description_marathi || null,
        image_url: resolvedImageUrl,
      },
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, description_hindi,
      description_marathi, image_url, name_hindi, name_marathi } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const uploadedFile = req.file;
    const resolvedImageUrl = uploadedFile ? await resolveUploadedFileUrl(uploadedFile, 'categories') : image_url || null;

    const result = await updateCategory(id, {
      name, name_hindi, name_marathi, description, description_hindi,
      description_marathi, image_url: resolvedImageUrl
    });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found or no changes made' });
    }

    return res.status(200).json({
      message: 'Category updated successfully',
      category: {
        id,
        name,
        name_hindi: name_hindi || null,
        name_marathi: name_marathi || null,
        description: description || null,
        description_hindi: description_hindi || null,
        description_marathi: description_marathi || null,
        image_url: resolvedImageUrl,
      },
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCategory(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found or already deleted' });
    }
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
