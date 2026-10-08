import express from 'express';
import {
  getCountries,
  getCountry,
  createCountryController,
  updateCountryController,
  deleteCountryController,
} from '../controllers/countries.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const CountriesRoutes = express.Router();

CountriesRoutes.get('/', getCountries);
CountriesRoutes.get('/:id', getCountry);
CountriesRoutes.post('/', protect, authorize('admin', 'super_admin'), createCountryController);
CountriesRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateCountryController);
CountriesRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteCountryController);

export default CountriesRoutes;
