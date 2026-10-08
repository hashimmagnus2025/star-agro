
import express from 'express';
import { registerUser, googleLogin, facebookLogin, loginUser, forgotPassword, resetPassword, sendOtp, verifyOtp, getCurrentUser, updateProfile, uploadDocument, getAllUsers, getUserByIdController, updateUserById, deleteUserById, verifyFarmerDocument, createUserByAdmin } from '../controllers/user.controller.js';
import { protect, authorize, hasPermission, restrictToOwnVillage } from '../middleware/auth.middleware.js';
import createUploader from '../middleware/multer.middleware.js';

const upload = createUploader("profile")
const UserRoutes = express.Router();

UserRoutes.post('/register', registerUser);
UserRoutes.post('/login', loginUser);
UserRoutes.post('/forgot-password', forgotPassword);
UserRoutes.post('/reset-password', resetPassword);
UserRoutes.post("/google-login", googleLogin);
UserRoutes.post("/facebook-login", facebookLogin);
UserRoutes.post('/send-otp', sendOtp);
UserRoutes.post('/verify-otp', verifyOtp);
UserRoutes.get('/me', protect, getCurrentUser);

UserRoutes.put('/me', upload.single("profile"), protect, updateProfile);
UserRoutes.post('/upload-document', upload.single("document"), protect, uploadDocument);
UserRoutes.put('/:id/document-status', protect, authorize('admin', 'super_admin'), verifyFarmerDocument);
UserRoutes.put('/:id', protect, hasPermission('user.edit'), restrictToOwnVillage, updateUserById);
UserRoutes.delete('/:id', protect, hasPermission('user.delete'), restrictToOwnVillage, deleteUserById);
UserRoutes.get('/:id', getUserByIdController);
UserRoutes.get('/', getAllUsers);
UserRoutes.post('/', protect, hasPermission('user.create'), createUserByAdmin);

export default UserRoutes;

