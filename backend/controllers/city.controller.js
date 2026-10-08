import {
  getAllCities,
  getCitiesByState,
  getCitiesByCountry,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
} from '../models/city.model.js';

export const getCities = async (req, res) => {
  try {
    const { state_id, country_id } = req.query;

    let cities;
    if (state_id) {
      cities = await getCitiesByState(state_id);
    } else if (country_id) {
      cities = await getCitiesByCountry(country_id);
    } else {
      cities = await getAllCities();
    }

    return res.status(200).json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCity = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await getCityById(id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }
    return res.status(200).json(city);
  } catch (error) {
    console.error('Error fetching city:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCityController = async (req, res) => {
  try {
    const {
      name,
      state_id,
      state_code,
      country_id,
      country_code,
      latitude,
      longitude,
      flag,
      wikiDataId,
    } = req.body;

    if (!name || !state_id || !state_code || !country_id || !country_code || !latitude || !longitude) {
      return res.status(400).json({ message: 'name, state_id, state_code, country_id, country_code, latitude and longitude are required' });
    }

    const insertId = await createCity({
      name,
      state_id,
      state_code,
      country_id,
      country_code,
      latitude,
      longitude,
      flag,
      wikiDataId,
    });

    return res.status(201).json({
      message: 'City created successfully',
      city: {
        id: insertId,
        name,
        state_id,
        state_code,
        country_id,
        country_code,
        latitude,
        longitude,
        flag: flag === undefined ? 1 : flag,
        wikiDataId: wikiDataId || null,
      },
    });
  } catch (error) {
    console.error('Error creating city:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCityController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      state_id,
      state_code,
      country_id,
      country_code,
      latitude,
      longitude,
      flag,
      wikiDataId,
    } = req.body;

    if (!name || !state_id || !state_code || !country_id || !country_code || !latitude || !longitude) {
      return res.status(400).json({ message: 'name, state_id, state_code, country_id, country_code, latitude and longitude are required' });
    }

    const result = await updateCity(id, {
      name,
      state_id,
      state_code,
      country_id,
      country_code,
      latitude,
      longitude,
      flag,
      wikiDataId,
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'City not found' });
    }

    return res.status(200).json({
      message: 'City updated successfully',
      city: {
        id,
        name,
        state_id,
        state_code,
        country_id,
        country_code,
        latitude,
        longitude,
        flag: flag === undefined ? 1 : flag,
        wikiDataId: wikiDataId || null,
      },
    });
  } catch (error) {
    console.error('Error updating city:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCityController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCity(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'City not found or already deleted' });
    }
    return res.status(200).json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
