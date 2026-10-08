import express from 'express';
import { createProductType, getProductTypes, getproductTypeByIds, updateProductTypeController, deleteProductTypeController } from '../controllers/product-type.controller.js';


const productTypeRouter = express.Router();

productTypeRouter.post('/', createProductType);
productTypeRouter.get('/', getProductTypes);
productTypeRouter.get('/:id', getproductTypeByIds);
productTypeRouter.put('/:id', updateProductTypeController);
productTypeRouter.delete('/:id', deleteProductTypeController);

export default productTypeRouter;