import * as SubSubCategoriesModel from '../models/sub-sub-categories.model.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

export const getAllSubSubCategories = async (req, res) => {
  try {
    const { sub_category_id } = req.query;
    
    if (sub_category_id) {
      const subSubCategories = await SubSubCategoriesModel.getSubSubCategoriesBySubCategory(sub_category_id);
      return res.json(subSubCategories);
    }
    
    const subSubCategories = await SubSubCategoriesModel.getAllSubSubCategories();
    res.json(subSubCategories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sub-sub-categories', error: error.message });
  }
};

export const getSubSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const subSubCategory = await SubSubCategoriesModel.getSubSubCategoryById(id);
    if (!subSubCategory) {
      return res.status(404).json({ message: 'Sub-sub-category not found' });
    }
    res.json(subSubCategory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sub-sub-category', error: error.message });
  }
};

export const createSubSubCategory = async (req, res) => {
  try {
    const { name, name_hindi, name_marathi, description, sub_category_id ,image } = req.body;

    if (!name || !sub_category_id) {
      return res.status(400).json({ message: 'Name and sub_category_id are required' });
    }
 const imageFile = req.file;
    const resolvedImage = imageFile
      ? await resolveUploadedFileUrl(imageFile, 'sub-sub-categories')
      : (typeof image === 'string' && image.trim() ? image.trim() : null);

    const insertId = await SubSubCategoriesModel.createSubSubCategory(
      name.trim(),
      name_hindi || null,
      name_marathi || null,
      description || '',
      sub_category_id,
      resolvedImage
    );

    res.status(201).json({ 
      message: 'Sub-sub-category created successfully', 
      subSubCategoryId: insertId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create sub-sub-category', error: error.message });
  }
};

export const updateSubSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, name_hindi, name_marathi, description, sub_category_id ,image } = req.body;

    if (!name || !sub_category_id) {
      return res.status(400).json({ message: 'Name and sub_category_id are required' });
    }

    const imageFile = req.file;
    const resolvedImage = imageFile
      ? await resolveUploadedFileUrl(imageFile, 'sub-sub-categories')
      : (typeof image === 'string' && image.trim() ? image.trim() : null);

    await SubSubCategoriesModel.updateSubSubCategory(
      id,
      name.trim(),
      name_hindi || null,
      name_marathi || null,
      description || '',
      sub_category_id,
      resolvedImage
    );

    res.json({
      message: 'Sub-sub-category updated successfully',
      subCategory: {
        id,
        name,
        name_hindi: name_hindi || null,
        name_marathi: name_marathi || null,
        description: description || null,
        sub_category_id,
        image: resolvedImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update sub-sub-category', error: error.message });
  }
};

export const deleteSubSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await SubSubCategoriesModel.deleteSubSubCategory(id);
    res.json({ message: 'Sub-sub-category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete sub-sub-category', error: error.message });
  }
};
