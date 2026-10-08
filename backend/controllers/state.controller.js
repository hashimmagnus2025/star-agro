import {
  getAllStates,
  getStatesByCountry,
  getStateById,
  createState,
  updateState,
  deleteState,
} from '../models/state.model.js';

export const getStates = async (req, res) => {
  try {
    const { country_id } = req.query;

    const states = country_id
      ? await getStatesByCountry(country_id)
      : await getAllStates();

    return res.status(200).json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getState = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await getStateById(id);
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }
    return res.status(200).json(state);
  } catch (error) {
    console.error('Error fetching state:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createStateController = async (req, res) => {
  try {
    const {
      name,
      country_id,
      country_code,
      fips_code,
      iso2,
      type,
      latitude,
      longitude,
      flag,
      wikiDataId,
    } = req.body;

    if (!name || !country_id || !country_code) {
      return res.status(400).json({ message: 'name, country_id and country_code are required' });
    }

    const insertId = await createState({
      name,
      country_id,
      country_code,
      fips_code,
      iso2,
      type,
      latitude,
      longitude,
      flag,
      wikiDataId,
    });

    return res.status(201).json({
      message: 'State created successfully',
      state: {
        id: insertId,
        name,
        country_id,
        country_code,
        fips_code: fips_code || null,
        iso2: iso2 || null,
        type: type || null,
        latitude: latitude || null,
        longitude: longitude || null,
        flag: flag === undefined ? 1 : flag,
        wikiDataId: wikiDataId || null,
      },
    });
  } catch (error) {
    console.error('Error creating state:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStateController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      country_id,
      country_code,
      fips_code,
      iso2,
      type,
      latitude,
      longitude,
      flag,
      wikiDataId,
    } = req.body;

    if (!name || !country_id || !country_code) {
      return res.status(400).json({ message: 'name, country_id and country_code are required' });
    }

    const result = await updateState(id, {
      name,
      country_id,
      country_code,
      fips_code,
      iso2,
      type,
      latitude,
      longitude,
      flag,
      wikiDataId,
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'State not found' });
    }

    return res.status(200).json({
      message: 'State updated successfully',
      state: {
        id,
        name,
        country_id,
        country_code,
        fips_code: fips_code || null,
        iso2: iso2 || null,
        type: type || null,
        latitude: latitude || null,
        longitude: longitude || null,
        flag: flag === undefined ? 1 : flag,
        wikiDataId: wikiDataId || null,
      },
    });
  } catch (error) {
    console.error('Error updating state:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteStateController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteState(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'State not found or already deleted' });
    }
    return res.status(200).json({ message: 'State deleted successfully' });
  } catch (error) {
    console.error('Error deleting state:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
