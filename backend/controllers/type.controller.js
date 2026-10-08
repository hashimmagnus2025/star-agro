import { insertType, getAllTypes, getTypeById, updateType, deleteType } from '../models/type.model.js';

export const createType = async (req, res) => {
  try {
    const { name, name_hindi, name_marathi, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const typeId = await insertType({ name, name_hindi, name_marathi, description, status });
    return res.status(201).json({ message: 'Type created successfully', typeId });
  } catch (error) {
    console.error('Error creating type:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTypes = async (req, res) => {
  try {
    const types = await getAllTypes();
    return res.status(200).json(types);
  } catch (error) {
    console.error('Error fetching types:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTypeByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await getTypeById(id);

    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }

    return res.status(200).json(type);
  } catch (error) {
    console.error('Error fetching type:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, name_hindi, name_marathi, description, status } = req.body;

    const existingType = await getTypeById(id);
    if (!existingType) {
      return res.status(404).json({ message: 'Type not found' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    await updateType(id, { name, name_hindi, name_marathi, description, status });
    return res.status(200).json({ message: 'Type updated successfully' });
  } catch (error) {
    console.error('Error updating type:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTypeController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingType = await getTypeById(id);
    if (!existingType) {
      return res.status(404).json({ message: 'Type not found' });
    }

    await deleteType(id);
    return res.status(200).json({ message: 'Type deleted successfully' });
  } catch (error) {
    console.error('Error deleting type:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
