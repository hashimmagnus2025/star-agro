import express from 'express';
import {
  getCities,
  getCity,
  createCityController,
  updateCityController,
  deleteCityController,
} from '../controllers/city.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const CityRoutes = express.Router();

CityRoutes.get('/', getCities);
CityRoutes.get('/:id', getCity);
CityRoutes.post('/', protect, authorize('admin', 'super_admin'), createCityController);
CityRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateCityController);
CityRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteCityController);

export default CityRoutes;
