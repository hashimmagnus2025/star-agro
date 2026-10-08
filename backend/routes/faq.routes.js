import express from 'express';


import { createFaqController,getAllFaqsController,getFaqByIdController, updateFaqController,deleteFaqController  } from '../controllers/faq.controller.js';


const faqRouter = express.Router();

 faqRouter.post('/', createFaqController);
 faqRouter.get('/', getAllFaqsController);
 faqRouter.get('/:id', getFaqByIdController);
 faqRouter.put('/:id', updateFaqController);
 faqRouter.delete('/:id', deleteFaqController);

 export default faqRouter;