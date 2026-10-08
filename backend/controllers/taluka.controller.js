import {
  getAllTalukas,
  getTalukasByDistrict,
  getTalukaById,
  createTaluka,
  updateTaluka,
  deleteTaluka,
} from '../models/taluka.model.js';

export const getTalukas = async (req, res) => {
  try {
    const { district_id } = req.query;

    const talukas = district_id
      ? await getTalukasByDistrict(district_id)
      : await getAllTalukas();

    return res.status(200).json(talukas);
  } catch (error) {
    console.error('Error fetching talukas:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTaluka = async (req, res) => {
  try {
    const { id } = req.params;
    const taluka = await getTalukaById(id);
    if (!taluka) {
      return res.status(404).json({ message: 'Taluka not found' });
    }
    return res.status(200).json(taluka);
  } catch (error) {
    console.error('Error fetching taluka:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTalukaController = async (req, res) => {
  try {
    const { district_id, taluka_code, taluka_name, status } = req.body;

    if (!district_id || !taluka_name) {
      return res.status(400).json({ message: 'district_id and taluka_name are required' });
    }

    const insertId = await createTaluka({ district_id, taluka_code, taluka_name, status });

    return res.status(201).json({
      message: 'Taluka created successfully',
      taluka: { id: insertId, district_id, taluka_code: taluka_code || null, taluka_name, status: status || 'Active' },
    });
  } catch (error) {
    console.error('Error creating taluka:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTalukaController = async (req, res) => {
  try {
    const { id } = req.params;
    const { district_id, taluka_code, taluka_name, status } = req.body;

    if (!district_id || !taluka_name) {
      return res.status(400).json({ message: 'district_id and taluka_name are required' });
    }

    const result = await updateTaluka(id, { district_id, taluka_code, taluka_name, status });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Taluka not found' });
    }

    return res.status(200).json({
      message: 'Taluka updated successfully',
      taluka: { id, district_id, taluka_code: taluka_code || null, taluka_name, status: status || 'Active' },
    });
  } catch (error) {
    console.error('Error updating taluka:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTalukaController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteTaluka(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Taluka not found or already deleted' });
    }
    return res.status(200).json({ message: 'Taluka deleted successfully' });
  } catch (error) {
    console.error('Error deleting taluka:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
