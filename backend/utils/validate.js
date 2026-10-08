import AppError from '../utils/AppError.js';

// Simple validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message).join('. ');
      return next(new AppError(messages, 400));
    }
    next();
  };
};

export default validate;
