import {
  getAllCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
} from '../models/countries.model.js';

export const getCountries = async (req, res) => {
  try {
    const countries = await getAllCountries();
    return res.status(200).json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await getCountryById(id);
    if (!country) {
      return res.status(404).json({ message: 'Country not found' });
    }
    return res.status(200).json(country);
  } catch (error) {
    console.error('Error fetching country:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCountryController = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Country name is required' });
    }

    const insertId = await createCountry(req.body);

    return res.status(201).json({
      message: 'Country created successfully',
      country: { id: insertId, ...req.body },
    });
  } catch (error) {
    console.error('Error creating country:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCountryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Country name is required' });
    }

    const result = await updateCountry(id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Country not found' });
    }

    return res.status(200).json({
      message: 'Country updated successfully',
      country: { id, ...req.body },
    });
  } catch (error) {
    console.error('Error updating country:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCountryController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCountry(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Country not found or already deleted' });
    }
    return res.status(200).json({ message: 'Country deleted successfully' });
  } catch (error) {
    console.error('Error deleting country:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
