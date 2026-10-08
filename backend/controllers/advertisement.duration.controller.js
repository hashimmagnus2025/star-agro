import {
  deleteAdvertisementDuration,
  getAdvertisementDurationById,
  getAllAdvertisementDurations,
  insertAdvertisementDuration,
  isAdvertisementDurationInUse,
  updateAdvertisementDuration,
} from '../models/advertisement.duration.model.js';



const validatePayload = ({ duration, label, status }) => {
  const parsedDuration = duration === '' || duration === null || duration === undefined ? null : Number(duration);
  if (parsedDuration !== null && (!Number.isInteger(parsedDuration) || parsedDuration <= 0)) {
    return { message: 'Duration must be a positive whole number' };
  }

  if (status !== 'Active' && status !== 'Inactive') return { message: 'Status must be Active or Inactive' };
  if (!['Days', 'Months', 'Years', 'Lifetime'].includes(label)) return { message: 'Please select a valid label' };
  return { duration: parsedDuration, label, status };
};

export const getAdvertisementDurations = async (req, res) => {
  try { return res.status(200).json(await getAllAdvertisementDurations()); }
  catch (error) { console.error('Error fetching advertisement durations:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const createAdvertisementDuration = async (req, res) => {
  try {
    const payload = validatePayload({ ...req.body, status: req.body.status || 'Active' });
    if (payload.message) return res.status(400).json(payload);
    const id = await insertAdvertisementDuration(payload);
    return res.status(201).json({ message: 'Advertisement duration created successfully', id });
  } catch (error) { console.error('Error creating advertisement duration:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const updateAdvertisementDurationController = async (req, res) => {
  try {
    const existing = await getAdvertisementDurationById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Advertisement duration not found' });
    const payload = validatePayload({ ...req.body, status: req.body.status || existing.status });
    if (payload.message) return res.status(400).json(payload);
    await updateAdvertisementDuration(req.params.id, payload);
    return res.status(200).json({ message: 'Advertisement duration updated successfully' });
  } catch (error) { console.error('Error updating advertisement duration:', error); return res.status(500).json({ message: 'Internal server error' }); }
};

export const deleteAdvertisementDurationController = async (req, res) => {
  try {
    const existing = await getAdvertisementDurationById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Advertisement duration not found' });
    if (await isAdvertisementDurationInUse(req.params.id)) {
      return res.status(400).json({ message: 'This duration is used by existing advertisements or prices. Mark it Inactive instead of deleting, or remove those first.' });
    }
    await deleteAdvertisementDuration(req.params.id);
    return res.status(200).json({ message: 'Advertisement duration deleted successfully' });
  } catch (error) { console.error('Error deleting advertisement duration:', error); return res.status(500).json({ message: 'Internal server error' }); }
};