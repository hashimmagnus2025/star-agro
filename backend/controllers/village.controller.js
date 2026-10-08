import {
  getAllVillages,
  getVillagesByTaluka,
  getVillageById,
  createVillage,
  updateVillage,
  deleteVillage,
} from '../models/village.model.js';

export const getVillages = async (req, res) => {
  try {
    const { taluka_id } = req.query;

    const villages = taluka_id
      ? await getVillagesByTaluka(taluka_id)
      : await getAllVillages();

    return res.status(200).json(villages);
  } catch (error) {
    console.error('Error fetching villages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVillage = async (req, res) => {
  try {
    const { id } = req.params;
    const village = await getVillageById(id);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }
    return res.status(200).json(village);
  } catch (error) {
    console.error('Error fetching village:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createVillageController = async (req, res) => {
  try {
    const { taluka_id, village_code, village_name, village_category, status } = req.body;

    if (!taluka_id || !village_code || !village_name) {
      return res.status(400).json({ message: 'taluka_id, village_code and village_name are required' });
    }

    const insertId = await createVillage({ taluka_id, village_code, village_name, village_category, status });

    return res.status(201).json({
      message: 'Village created successfully',
      village: { id: insertId, taluka_id, village_code, village_name, village_category: village_category || null, status: status || 'active' },
    });
  } catch (error) {
    console.error('Error creating village:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateVillageController = async (req, res) => {
  try {
    const { id } = req.params;
    const { taluka_id, village_code, village_name, village_category, status } = req.body;

    if (!taluka_id || !village_code || !village_name) {
      return res.status(400).json({ message: 'taluka_id, village_code and village_name are required' });
    }

    const result = await updateVillage(id, { taluka_id, village_code, village_name, village_category, status });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Village not found' });
    }

    return res.status(200).json({
      message: 'Village updated successfully',
      village: { id, taluka_id, village_code, village_name, village_category: village_category || null, status: status || 'active' },
    });
  } catch (error) {
    console.error('Error updating village:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteVillageController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteVillage(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Village not found or already deleted' });
    }
    return res.status(200).json({ message: 'Village deleted successfully' });
  } catch (error) {
    console.error('Error deleting village:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
