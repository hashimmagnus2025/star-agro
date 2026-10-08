import fs from 'fs';
import {
  insertJobApplication,
  getAllJobApplications,
  getJobApplicationById,
  updateJobApplicationStatus,
  deleteJobApplication,
} from '../models/jobs.model.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

const ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export const saveJobApplication = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      state,
      district,
      taluka,
      village,
      applying_for,
      subject,
      description,
    } = req.body;
    const uploadedFile = req.file;

    if (!first_name || !last_name || !phone || !email || !applying_for) {
      if (uploadedFile) fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({ message: 'First name, last name, phone, email and applying for are required' });
    }

    if (!uploadedFile) {
      return res.status(400).json({ message: 'Please upload your CV (PDF or DOC only)' });
    }

    const ext = uploadedFile.originalname.slice(uploadedFile.originalname.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_CV_EXTENSIONS.includes(ext)) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({ message: 'CV must be a PDF or DOC/DOCX file' });
    }

    const cv_file = await resolveUploadedFileUrl(uploadedFile, 'jobs');

    const result = await insertJobApplication({
      first_name,
      last_name,
      phone,
      email,
      state,
      district,
      taluka,
      village,
      applying_for,
      subject,
      description,
      cv_file,
    });

    return res.status(201).json({
      message: 'Job application submitted successfully',
      id: result.insertId,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Error saving job application:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const items = await getAllJobApplications();
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getJobApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getJobApplicationById(id);
    if (!item) {
      return res.status(404).json({ message: 'Job application not found' });
    }
    return res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching job application:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateJobApplicationStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const existing = await getJobApplicationById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Job application not found' });
    }
    await updateJobApplicationStatus(id, status);
    return res.status(200).json({ message: 'Job application status updated successfully' });
  } catch (error) {
    console.error('Error updating job application status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteJobApplicationController = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getJobApplicationById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Job application not found' });
    }
    await deleteJobApplication(id);
    return res.status(200).json({ message: 'Job application deleted successfully' });
  } catch (error) {
    console.error('Error deleting job application:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
