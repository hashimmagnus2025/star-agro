import {
  getAllDistricts,
  getDistrictsByState,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from '../models/district.model.js';

export const getDistricts = async (req, res) => {
  try {
    const { state_id } = req.query;

    const districts = state_id
      ? await getDistrictsByState(state_id)
      : await getAllDistricts();

    return res.status(200).json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const district = await getDistrictById(id);
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    return res.status(200).json(district);
  } catch (error) {
    console.error('Error fetching district:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDistrictController = async (req, res) => {
  try {
    const { state_id, district_code, district_name, status } = req.body;

    if (!state_id || !district_name) {
      return res.status(400).json({ message: 'state_id and district_name are required' });
    }

    const insertId = await createDistrict({ state_id, district_code, district_name, status });

    return res.status(201).json({
      message: 'District created successfully',
      district: { id: insertId, state_id, district_code: district_code || null, district_name, status: status || 'Active' },
    });
  } catch (error) {
    console.error('Error creating district:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDistrictController = async (req, res) => {
  try {
    const { id } = req.params;
    const { state_id, district_code, district_name, status } = req.body;

    if (!state_id || !district_name) {
      return res.status(400).json({ message: 'state_id and district_name are required' });
    }

    const result = await updateDistrict(id, { state_id, district_code, district_name, status });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'District not found' });
    }

    return res.status(200).json({
      message: 'District updated successfully',
      district: { id, state_id, district_code: district_code || null, district_name, status: status || 'Active' },
    });
  } catch (error) {
    console.error('Error updating district:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDistrictController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteDistrict(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'District not found or already deleted' });
    }
    return res.status(200).json({ message: 'District deleted successfully' });
  } catch (error) {
    console.error('Error deleting district:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
