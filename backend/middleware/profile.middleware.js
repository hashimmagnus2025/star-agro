import AppError from '../utils/AppError.js';

const REQUIRED_PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'gender',
  'state',
  'district',
  'taluka',
  'village',
  'address',
  'has_solar_dryer',
  'how_know_about_us',
];

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

export const isProfileComplete = (user) =>
  REQUIRED_PROFILE_FIELDS.every((field) => hasValue(user?.[field]));

export const requireCompleteProfile = (req, res, next) => {
  if (['admin', 'super_admin'].includes(req.user?.role)) {
    return next();
  }

  if (!isProfileComplete(req.user)) {
    const error = new AppError(
      'Please complete your profile before creating a listing.',
      403
    );
    error.code = 'PROFILE_INCOMPLETE';
    return next(error);
  }

  return next();
};