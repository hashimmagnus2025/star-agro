import express from 'express';

import { createRole, getAllRoles, getRoleById, updateRole, deleteRole } from '../controllers/role.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const RoleRouter = express.Router();

// Any logged-in user can view roles (needed to populate the role dropdown on their profile).
RoleRouter.get('/', protect, getAllRoles);
RoleRouter.get('/:id', protect, getRoleById);

// Only admins can create/update/delete roles or change their permissions.
RoleRouter.post('/', protect, authorize('admin', 'super_admin'), createRole);
RoleRouter.put('/:id', protect, authorize('admin', 'super_admin'), updateRole);
RoleRouter.delete('/:id', protect, authorize('admin', 'super_admin'), deleteRole);

export default RoleRouter;