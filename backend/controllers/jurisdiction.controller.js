import {
  upsertJurisdiction,
  getJurisdictionByUserId,
  deleteJurisdictionByUserId,
  resolveScopeNames,
  getTalukaRepsInDistrict,
  getVillageRepsInTaluka,
  getTalukaById,
  getVillageById,
  getUsersInVillage,
} from '../models/jurisdiction.model.js';
import { getUserById } from '../models/user.model.js';
import { getRoleByName } from '../models/role.model.js';
import { checkPermission } from '../middleware/auth.middleware.js';

// Permission required to view each level's "My Team" list. Lets an admin grant/revoke,
// per role, whether a District/Taluka/Village Representative can see their subordinates.
const TEAM_VIEW_PERMISSION = {
  district: 'taluka.view',
  taluka: 'village.view',
  village: 'user.view',
};

const SCOPE_TYPES = ['district', 'taluka', 'village'];

export const assignJurisdiction = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role_name, scope_type, scope_id } = req.body;

    if (!role_name || !scope_type || !scope_id) {
      return res.status(400).json({ message: 'role_name, scope_type and scope_id are required' });
    }
    if (!SCOPE_TYPES.includes(scope_type)) {
      return res.status(400).json({ message: `scope_type must be one of: ${SCOPE_TYPES.join(', ')}` });
    }

    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = await getRoleByName(role_name);
    if (!role) {
      return res.status(400).json({ message: 'Role not found' });
    }

    const scopeNames = await resolveScopeNames({ scope_type, scope_id });
    const scopeLabel = scopeNames.village_name || scopeNames.taluka_name || scopeNames.district_name;
    if (!scopeLabel) {
      return res.status(400).json({ message: 'Invalid scope_id for the given scope_type' });
    }

    await upsertJurisdiction({
      user_id: userId,
      role_name,
      scope_type,
      scope_id,
      assigned_by: req.user.id,
    });

    res.status(200).json({ success: true, message: 'Representative role assigned successfully' });
  } catch (error) {
    console.error('assignJurisdiction error', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeJurisdiction = async (req, res) => {
  try {
    const { userId } = req.params;
    await deleteJurisdictionByUserId(userId);
    res.status(200).json({ success: true, message: 'Representative role removed successfully' });
  } catch (error) {
    console.error('removeJurisdiction error', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getJurisdictionForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const jurisdiction = await getJurisdictionByUserId(userId);
    if (!jurisdiction) {
      return res.status(200).json(null);
    }
    const scopeNames = await resolveScopeNames(jurisdiction);
    const scopeLabel = scopeNames.village_name || scopeNames.taluka_name || scopeNames.district_name;
    res.status(200).json({ ...jurisdiction, scope_label: scopeLabel });
  } catch (error) {
    console.error('getJurisdictionForUser error', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyTeam = async (req, res) => {
  try {
    const jurisdiction = await getJurisdictionByUserId(req.user.id);
    if (!jurisdiction) {
      return res.status(200).json({ scope_type: null });
    }

    const requiredPermission = TEAM_VIEW_PERMISSION[jurisdiction.scope_type];
    const { allowed } = await checkPermission(req.user, requiredPermission);
    if (!allowed) {
      return res.status(403).json({ message: "You don't have permission to view your team." });
    }

    const scopeNames = await resolveScopeNames(jurisdiction);
    const scopeLabel = scopeNames.village_name || scopeNames.taluka_name || scopeNames.district_name;
    const [canViewVillageReps, canViewUsers] = await Promise.all([
      jurisdiction.scope_type === 'district'
        ? checkPermission(req.user, 'village.view').then(({ allowed }) => allowed)
        : Promise.resolve(jurisdiction.scope_type === 'taluka'),
      jurisdiction.scope_type !== 'village'
        ? checkPermission(req.user, 'user.view').then(({ allowed }) => allowed)
        : Promise.resolve(true),
    ]);

    if (jurisdiction.scope_type === 'district') {
      const talukaReps = await getTalukaRepsInDistrict(jurisdiction.scope_id);
      return res.status(200).json({
        scope_type: 'district',
        scope_label: scopeLabel,
        talukaReps,
        canViewVillageReps,
        canViewUsers,
      });
    }

    if (jurisdiction.scope_type === 'taluka') {
      const villageReps = await getVillageRepsInTaluka(jurisdiction.scope_id);
      return res.status(200).json({
        scope_type: 'taluka',
        scope_label: scopeLabel,
        villageReps,
        canViewVillageReps,
        canViewUsers,
      });
    }

    const users = await getUsersInVillage(scopeNames);
    return res.status(200).json({
      scope_type: 'village',
      scope_label: scopeLabel,
      users,
      canViewVillageReps,
      canViewUsers,
    });
  } catch (error) {
    console.error('getMyTeam error', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTalukaTeam = async (req, res) => {
  try {
    const jurisdiction = await getJurisdictionByUserId(req.user.id);
    if (!jurisdiction || jurisdiction.scope_type !== 'district') {
      return res.status(403).json({ message: 'Only a District Representative can open a taluka team.' });
    }

    const { allowed } = await checkPermission(req.user, 'village.view');
    if (!allowed) {
      return res.status(403).json({ message: "You don't have permission to view Village Representatives." });
    }

    const taluka = await getTalukaById(req.params.talukaId);
    if (!taluka) {
      return res.status(404).json({ message: 'Taluka not found.' });
    }
    if (Number(taluka.district_id) !== Number(jurisdiction.scope_id)) {
      return res.status(403).json({ message: 'You can only view talukas in your assigned district.' });
    }

    const villageReps = await getVillageRepsInTaluka(taluka.id);
    return res.status(200).json({
      taluka_id: taluka.id,
      taluka_name: taluka.taluka_name,
      villageReps,
    });
  } catch (error) {
    console.error('getTalukaTeam error', error.message || error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVillageTeam = async (req, res) => {
  try {
    const jurisdiction = await getJurisdictionByUserId(req.user.id);
    if (!jurisdiction) {
      return res.status(403).json({ message: 'You do not have a representative scope assigned.' });
    }

    const { allowed } = await checkPermission(req.user, 'user.view');
    if (!allowed) {
      return res.status(403).json({ message: "You don't have permission to view users." });
    }

    const village = await getVillageById(req.params.villageId);
    if (!village) {
      return res.status(404).json({ message: 'Village not found.' });
    }

    const isWithinScope = (
      (jurisdiction.scope_type === 'district' && Number(village.district_id) === Number(jurisdiction.scope_id))
      || (jurisdiction.scope_type === 'taluka' && Number(village.taluka_id) === Number(jurisdiction.scope_id))
      || (jurisdiction.scope_type === 'village' && Number(village.id) === Number(jurisdiction.scope_id))
    );
    if (!isWithinScope) {
      return res.status(403).json({ message: 'You can only view users within your assigned area.' });
    }

    const users = await getUsersInVillage(village);
    return res.status(200).json({
      village_id: village.id,
      village_name: village.village_name,
      taluka_name: village.taluka_name,
      users,
    });
  } catch (error) {
    console.error('getVillageTeam error', error.message || error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
