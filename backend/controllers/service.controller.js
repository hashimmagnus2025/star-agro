import fs from 'fs';
import axios from 'axios';
import {
  SERVICE_TYPES,
  insertService,
  getAllServices,
  getApprovedActiveServices,
  getServicesByUserId,
  getServiceById,
  updateService as updateServiceModel,
  deleteService as deleteServiceModel,
  updateServiceStatus as updateServiceStatusModel,
  updateServiceActive as updateServiceActiveModel,
} from '../models/service.model.js';
import { getUserById } from '../models/user.model.js';
import { createNotification } from '../models/notification.model.js';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';
import {
  resolveNotificationLang,
  serviceApprovedMessage,
  serviceRejectedMessage,
} from '../utils/notificationMessages.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

const buildMediaPath = (file) => (file ? resolveUploadedFileUrl(file, 'services') : null);
const getUploadedFile = (files, fieldName) => files?.[fieldName]?.[0];
const removeUploadedFiles = (files) => {
  Object.values(files || {}).flat().forEach((file) => fs.unlink(file.path, () => {}));
};

export const createService = async (req, res) => {
  try {
    const { service_type, name, description, price, price_unit, contact_number, coverage_area, recaptchaToken } = req.body;

    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        removeUploadedFiles(req.files);
        return res.status(400).json({ message: 'Please verify you are not a robot.' });
      }

      const verifyResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
        params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: recaptchaToken },
      });

      if (!verifyResponse.data.success) {
        removeUploadedFiles(req.files);
        return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
      }
    }

    if (!service_type || !SERVICE_TYPES.includes(service_type)) {
      removeUploadedFiles(req.files);
      return res.status(400).json({ message: `service_type must be one of: ${SERVICE_TYPES.join(', ')}` });
    }
    if (!name || !name.trim()) {
      removeUploadedFiles(req.files);
      return res.status(400).json({ message: 'Name is required' });
    }

    const result = await insertService({
      user_id: req.user.id,
      service_type,
      name,
      description,
      price: price ? parseFloat(price) : null,
      price_unit,
      contact_number,
      coverage_area,
      image_url: await buildMediaPath(getUploadedFile(req.files, 'image')),
      video_url: await buildMediaPath(getUploadedFile(req.files, 'video')),
      status: 'Pending',
    });

    return res.status(201).json({ message: 'Service submitted successfully', id: result.insertId });
  } catch (error) {
    removeUploadedFiles(req.files);
    console.error('Error creating service:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getServices = async (req, res) => {
  try {
    const { user_id } = req.query;
    const isAdmin = req.user && ['admin', 'super_admin'].includes(req.user.role);

    if (user_id) {
      const services = await getServicesByUserId(user_id);
      const visibleServices = isAdmin || String(req.user?.id) === String(user_id)
        ? services
        : services.filter((service) => service.status === 'Approved' && Number(service.is_active) === 1);
      return res.status(200).json(visibleServices);
    }

    const services = req.user ? await getAllServices() : await getApprovedActiveServices();
    return res.status(200).json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyServices = async (req, res) => {
  try {
    const services = await getServicesByUserId(req.user.id);
    return res.status(200).json(services);
  } catch (error) {
    console.error('Error fetching my services:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getService = async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    return res.status(200).json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateServiceController = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getServiceById(id);
    if (!existing) {
      removeUploadedFiles(req.files);
      return res.status(404).json({ message: 'Service not found' });
    }
    if (existing.user_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      removeUploadedFiles(req.files);
      return res.status(403).json({ message: 'You do not have permission to edit this service' });
    }

    const { service_type, name, description, price, price_unit, contact_number, coverage_area } = req.body;
    if (!service_type || !SERVICE_TYPES.includes(service_type)) {
      removeUploadedFiles(req.files);
      return res.status(400).json({ message: `service_type must be one of: ${SERVICE_TYPES.join(', ')}` });
    }
    if (!name || !name.trim()) {
      removeUploadedFiles(req.files);
      return res.status(400).json({ message: 'Name is required' });
    }

    const isOwnerEditingApproved = existing.user_id === req.user.id && !['admin', 'super_admin'].includes(req.user.role);

    await updateServiceModel(id, {
      service_type,
      name,
      description,
      price: price ? parseFloat(price) : null,
      price_unit,
      contact_number,
      coverage_area,
      image_url: getUploadedFile(req.files, 'image')
        ? await buildMediaPath(getUploadedFile(req.files, 'image'))
        : existing.image_url,
      video_url: getUploadedFile(req.files, 'video')
        ? await buildMediaPath(getUploadedFile(req.files, 'video'))
        : existing.video_url,
      status: isOwnerEditingApproved ? 'Pending' : existing.status,
    });

    return res.status(200).json({ message: 'Service updated successfully' });
  } catch (error) {
    removeUploadedFiles(req.files);
    console.error('Error updating service:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateServiceStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const existing = await getServiceById(id);
    if (!existing) return res.status(404).json({ message: 'Service not found' });
    await updateServiceStatusModel(id, status);

    if (status === 'Approved' || status === 'Rejected') {
      const owner = existing.user_id ? await getUserById(existing.user_id) : null;
      const lang = resolveNotificationLang(owner?.language);
      const message = status === 'Approved'
        ? serviceApprovedMessage(lang, existing.name)
        : serviceRejectedMessage(lang, existing.name);

      if (existing.user_id) {
        try {
          await createNotification({
            userId: existing.user_id,
            type: status === 'Approved' ? 'approval' : 'rejection',
            title: status === 'Approved' ? 'Service Approved' : 'Service Rejected',
            message,
            data: { itemLabel: 'service', name: existing.name },
          });
        } catch (notificationError) {
          console.error('Failed to save service status notification:', notificationError.message || notificationError);
        }
      }

      try {
        if (owner?.phone) {
          await sendWhatsAppMessage(owner.phone, `Star Agro: ${message}`);
        }
      } catch (notificationError) {
        console.error('Failed to send service status WhatsApp notification:', notificationError?.message || notificationError);
      }
    }

    return res.status(200).json({ message: 'Service status updated successfully' });
  } catch (error) {
    console.error('Error updating service status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateServiceActiveController = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const existing = await getServiceById(id);
    if (!existing) return res.status(404).json({ message: 'Service not found' });
    if (existing.user_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to update this service' });
    }
    await updateServiceActiveModel(id, is_active);
    return res.status(200).json({ message: 'Service active status updated successfully' });
  } catch (error) {
    console.error('Error updating service active status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteServiceController = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getServiceById(id);
    if (!existing) return res.status(404).json({ message: 'Service not found' });
    if (existing.user_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to delete this service' });
    }
    await deleteServiceModel(id);
    return res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
