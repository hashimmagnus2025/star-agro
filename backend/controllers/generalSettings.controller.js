import {
  getGeneralSettingsModel,
  updateGeneralSettingsModel,
} from '../models/generalSettings.model.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

export const getGeneralSettings = async (req, res) => {
  try {
    const rows = await getGeneralSettingsModel();

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'No general settings found',
      });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching general settings:', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const updateGeneralSettings = async (req, res) => {
  const {
    name,
    company_name,
    company_email,
    company_phone,
    address,
    company_address,
    location,
    gst,
    description,
    logo,
    favicon,
    whatsapp_api_url,
    whatsapp_api_key,
  } = req.body;

  const uploadedLogo = req.files?.logo?.[0];
  const uploadedFavicon = req.files?.favicon?.[0];

  const resolvedData = {
    name: name || '',
    company_name: company_name || null,
    company_email: company_email || '',
    company_phone: company_phone || '',
    address: address || null,
    company_address: company_address || null,
    location: location || null,
    gst: gst || null,
    description: description || '',
    logo: uploadedLogo
      ? await resolveUploadedFileUrl(uploadedLogo, 'generalSettings')
      : logo || null,
    favicon: uploadedFavicon
      ? await resolveUploadedFileUrl(uploadedFavicon, 'generalSettings')
      : favicon || null,
    whatsapp_api_url: whatsapp_api_url || null,
    whatsapp_api_key: whatsapp_api_key || null,
  };

  if (
    !resolvedData.name ||
    !resolvedData.description ||
    !resolvedData.company_email ||
    !resolvedData.company_phone
  ) {
    return res.status(400).json({
      message: 'Name, description, company email, and company phone are required',
    });
  }

  try {
    const result = await updateGeneralSettingsModel(resolvedData);

    res.status(200).json({
      message: 'General settings updated successfully',
      result,
    });
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};
