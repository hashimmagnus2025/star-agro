import {
  insertSubCategory,
  getAllSubCategories,
  getSubCategoriesByCategory,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
} from '../models/sub-categories.model.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

export const createSubCategory = async (req, res) => {
  try {
    const { name, name_hindi, name_marathi, description, description_hindi, description_marathi, category_id, image } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ message: 'Subcategory name and category are required' });
    }

    const imageFile = req.file;
    const resolvedImage = imageFile
      ? await resolveUploadedFileUrl(imageFile, 'sub-categories')
      : (typeof image === 'string' && image.trim() ? image.trim() : null);

    const result = await insertSubCategory({ name, name_hindi, name_marathi, description, description_hindi, description_marathi, category_id, image: resolvedImage });
    return res.status(201).json({
      message: 'Subcategory created successfully',
      subCategory: {
        id: result.insertId,
        name,
        name_hindi: name_hindi || null,
        name_marathi: name_marathi || null,
        description: description || null,
        description_hindi: description_hindi || null,
        description_marathi: description_marathi || null,
        category_id,
        image: resolvedImage,
      },
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSubCategories = async (req, res) => {
  try {
    const { category_id } = req.query;
    
    if (category_id) {
      const subcategories = await getSubCategoriesByCategory(category_id);
      return res.status(200).json(subcategories);
    }
    
    const subcategories = await getAllSubCategories();
    return res.status(200).json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await getSubCategoryById(id);
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    return res.status(200).json(subcategory);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSubCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, name_hindi, name_marathi, description, description_hindi, description_marathi, category_id, image } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ message: 'Subcategory name and category are required' });
    }

    const existingSubCategory = await getSubCategoryById(id);
    if (!existingSubCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    const imageFile = req.file;
    const resolvedImage = imageFile
      ? await resolveUploadedFileUrl(imageFile, 'sub-categories')
      : (typeof image === 'string' && image.trim() ? image.trim() : existingSubCategory.image || null);

    const result = await updateSubCategory(id, { name, name_hindi, name_marathi, description, description_hindi, description_marathi, category_id, image: resolvedImage });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subcategory not found or no changes made' });
    }

    return res.status(200).json({
      message: 'Subcategory updated successfully',
      subCategory: {
        id,
        name,
        name_hindi: name_hindi || null,
        name_marathi: name_marathi || null,
        description: description || null,
        description_hindi: description_hindi || null,
        description_marathi: description_marathi || null,
        category_id,
        image: resolvedImage,
      },
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSubCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteSubCategory(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subcategory not found or already deleted' });
    }
    return res.status(200).json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
