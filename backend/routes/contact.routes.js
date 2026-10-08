import express from 'express';
import {
  saveContactMessage,
  getContactMessages,
  getContactMessage,
} from '../controllers/contact.controller.js';

const ContactRouter = express.Router();

ContactRouter.post('/', saveContactMessage);
ContactRouter.get('/', getContactMessages);
ContactRouter.get('/:id', getContactMessage);

export default ContactRouter;
