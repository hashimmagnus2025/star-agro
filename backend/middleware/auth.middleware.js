import { verifyToken } from '../utils/jwt.js';
import { getUserById } from "../models/user.model.js";
import { getRoleByName } from "../models/role.model.js";
import { getPermissionByName } from "../models/permissions.model.js";
import { getJurisdictionByUserId, resolveScopeNames } from "../models/jurisdiction.model.js";
import AppError from "../utils/AppError.js";
import { normalizeVillageManagedUserRole } from '../utils/villageManagedRoles.js';

// Protect routes - verify access token
export const protect = async (req, res, next) => {
  console.log('[Auth] protect request', { path: req.path, method: req.method, authorization: req.headers.authorization });
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    console.error('[Auth] No Authorization token present', req.headers.authorization);
    return next(new AppError("Access denied. No token provided.", 401));
  }

  try {
    const decoded = verifyToken(token);
    console.log('[Auth] decoded token', decoded);
    const user = await getUserById(decoded.id);
    if (!user) {
      console.error('[Auth] Token verified but user not found', decoded);
      return next(new AppError("User not found. Token invalid.", 401));
    }
    if (user.isBlocked) {
      return next(new AppError("Your account has been blocked. Contact support.", 403));
    }
    const { password, remember_token, ...sanitizedUser } = user;
    req.user = sanitizedUser;
    next();
  } catch (error) {
    console.error('[Auth] token verify failed', error);
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Access token expired. Please refresh.", 401));
    }
    return next(new AppError("Invalid token.", 401));
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.id);
    req.user = user ? { ...user, password: undefined, remember_token: undefined } : null;
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized to access this resource.`, 403));
    }
    next();
  };
};

// Core permission check, shared by the hasPermission middleware and any controller
// (e.g. getMyTeam) that needs to branch on a permission without a dedicated route.
// Resolves the user's role plus their location-scoped jurisdiction role_name (unioned),
// looks up the permission's id, and checks it against each role's comma-separated
// permissions list. admin/super_admin always pass. Returns the jurisdiction too, since
// callers (hasPermission) cache it on req.userJurisdiction to avoid a second lookup.
export const checkPermission = async (user, permissionName) => {
  if (user.role === 'admin' || user.role === 'super_admin') {
    return { allowed: true, jurisdiction: null };
  }

  const [jurisdiction, permission] = await Promise.all([
    getJurisdictionByUserId(user.id),
    getPermissionByName(permissionName),
  ]);

  const roleNames = [user.role, jurisdiction?.role_name].filter(Boolean);
  const roles = await Promise.all(roleNames.map((name) => getRoleByName(name)));

  // Roles store their assigned permissions as comma-separated permission IDs
  // (this matches how the admin Roles/Permissions panel saves them), so the
  // permission name passed here has to be resolved to its ID before comparing.
  const assignedIds = roles.flatMap((role) =>
    role?.permissions ? role.permissions.split(',').map((p) => p.trim()) : []
  );

  const allowed = Boolean(permission) && assignedIds.includes(String(permission.id));
  return { allowed, jurisdiction };
};

// Permission-based access control - looks up the user's role in the roles table
// and checks its assigned permissions. super_admin/admin always have full access.
// A user's additional location-scoped "representative" role (user_jurisdictions) is
// unioned in too, so e.g. a Village Representative's user.create/edit/delete grants apply
// on top of their normal farmer/user role.
export const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Access denied. No user found.', 401));
    }

    try {
      const { allowed, jurisdiction } = await checkPermission(req.user, permissionName);
      req.userJurisdiction = jurisdiction;

      if (!allowed) {
        return next(new AppError(`You don't have permission to perform this action.`, 403));
      }
      next();
    } catch (error) {
      return next(new AppError('Failed to verify permissions.', 500));
    }
  };
};

// Scopes the existing user PUT/DELETE routes so a non-admin (a Village Representative who
// passed hasPermission('user.edit'/'user.delete')) can only act on users within their own
// village. Admin/super_admin already short-circuit hasPermission and never reach this check.
export const restrictToOwnVillage = async (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return next();
  }

  try {
    const jurisdiction = req.userJurisdiction || (await getJurisdictionByUserId(req.user.id));
    if (!jurisdiction || jurisdiction.scope_type !== 'village') {
      return next(new AppError('You do not have a village assigned to manage users.', 403));
    }

    const { village_name, taluka_name, district_name } = await resolveScopeNames(jurisdiction);
    const targetUser = await getUserById(req.params.id);
    if (!targetUser) {
      return next(new AppError('User not found', 404));
    }

    if (
      targetUser.village !== village_name ||
      targetUser.taluka !== taluka_name ||
      targetUser.district !== district_name
    ) {
      return next(new AppError('You can only manage users in your own village.', 403));
    }

    if (!normalizeVillageManagedUserRole(targetUser.role || 'user')) {
      return next(new AppError('You can only manage user, farmer, or trader accounts.', 403));
    }

    if (req.method === 'PUT' && req.body?.role !== undefined && !normalizeVillageManagedUserRole(req.body.role)) {
      return next(new AppError('Select a valid user, farmer, or trader role.', 400));
    }

    next();
  } catch (error) {
    return next(new AppError('Failed to verify village jurisdiction.', 500));
  }
};
