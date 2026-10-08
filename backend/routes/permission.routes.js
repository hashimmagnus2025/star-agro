import express from 'express';

import { createPermission, getAllPermissions, getPermissionById, updatePermission, deletePermission } from '../controllers/permission.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const PermissionRoutes= express.Router();

PermissionRoutes.use(protect, authorize('admin', 'super_admin'));

PermissionRoutes.post('/', createPermission);
PermissionRoutes.get('/', getAllPermissions);
PermissionRoutes.get('/:id', getPermissionById);
PermissionRoutes.put('/:id', updatePermission);
PermissionRoutes.delete('/:id', deletePermission);

export default PermissionRoutes;