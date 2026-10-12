import {
  upsertJurisdiction,
  getJurisdictionByUserId,
  deleteJurisdictionByUserId,
  resolveScopeNames,
  getTalukaRepsInDistrict,
  getTalukaRepsForTalukaIds,
  getVillageRepsInTaluka,
  getTalukaById,
  getVillageById,
  getUsersInVillage,
  getAssignedTalukaIdsForJurisdiction,
  setJurisdictionTalukas,
  getTalukasWithAssignmentStatus,
  getAssignedVillageIdsForJurisdiction,
  setJurisdictionVillages,
  getVillagesWithAssignmentStatus,
  getVillageRepsForVillageIds,
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
    const { role_name, scope_type, scope_id, taluka_ids, village_ids } = req.body;

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

    // A District Representative's scope can optionally be narrowed to a specific subset
    // of talukas, and a Taluka Representative's scope to a specific subset of villages
    // (so a district/taluka can be split between multiple reps). Validate exclusivity up
    // front — a taluka/village already claimed by a different representative can't be reused.
    let normalizedTalukaIds = null;
    if (scope_type === 'district' && Array.isArray(taluka_ids)) {
      normalizedTalukaIds = [...new Set(taluka_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))];

      const districtTalukas = await getTalukasWithAssignmentStatus(scope_id, userId);
      const takenIds = normalizedTalukaIds.filter((id) => {
        const taluka = districtTalukas.find((t) => Number(t.id) === id);
        return taluka?.taken_by;
      });
      if (takenIds.length > 0) {
        return res.status(409).json({ message: 'One or more selected talukas are already assigned to another representative.' });
      }
    }

    let normalizedVillageIds = null;
    if (scope_type === 'taluka' && Array.isArray(village_ids)) {
      normalizedVillageIds = [...new Set(village_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))];

      const talukaVillages = await getVillagesWithAssignmentStatus(scope_id, userId);
      const takenIds = normalizedVillageIds.filter((id) => {
        const village = talukaVillages.find((v) => Number(v.id) === id);
        return village?.taken_by;
      });
      if (takenIds.length > 0) {
        return res.status(409).json({ message: 'One or more selected villages are already assigned to another representative.' });
      }
    }

    await upsertJurisdiction({
      user_id: userId,
      role_name,
      scope_type,
      scope_id,
      assigned_by: req.user.id,
    });

    // Keep the taluka/village subset tables in sync with the CURRENT scope_type — upsert
    // reuses the same jurisdiction row (same id) on every save, so switching a rep away
    // from district/taluka (or back) must explicitly release any talukas/villages they
    // previously held. Otherwise the UNIQUE constraint keeps those talukas/villages
    // permanently claimed by this row even though the rep no longer manages them.
    const jurisdiction = await getJurisdictionByUserId(userId);
    await setJurisdictionTalukas(jurisdiction.id, scope_type === 'district' ? (normalizedTalukaIds || []) : []);
    await setJurisdictionVillages(jurisdiction.id, scope_type === 'taluka' ? (normalizedVillageIds || []) : []);

    res.status(200).json({ success: true, message: 'Representative role assigned successfully' });
  } catch (error) {
    console.error('assignJurisdiction error', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin-only helper for the "Assign Representative" picker: lists every taluka in a
// district with who (if anyone) already manages it, so talukas claimed by a different
// District Representative can be excluded/disabled in the UI. `excludeUserId` is the
// representative currently being edited — their own existing picks stay selectable.
export const getDistrictTalukaAssignments = async (req, res) => {
  try {
    const { district_id, exclude_user_id } = req.query;
    if (!district_id) {
      return res.status(400).json({ message: 'district_id is required' });
    }

    const talukas = await getTalukasWithAssignmentStatus(district_id, exclude_user_id || null);
    res.status(200).json(talukas);
  } catch (error) {
    console.error('getDistrictTalukaAssignments error', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Same idea, one level down: lists every village in a taluka with who (if anyone) already
// manages it, so villages claimed by a different Taluka Representative can be
// excluded/disabled in the admin picker.
export const getTalukaVillageAssignments = async (req, res) => {
  try {
    const { taluka_id, exclude_user_id } = req.query;
    if (!taluka_id) {
      return res.status(400).json({ message: 'taluka_id is required' });
    }

    const villages = await getVillagesWithAssignmentStatus(taluka_id, exclude_user_id || null);
    res.status(200).json(villages);
  } catch (error) {
    console.error('getTalukaVillageAssignments error', error.message || error);
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
    const [canViewVillageReps, canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers] = await Promise.all([
      jurisdiction.scope_type === 'district'
        ? checkPermission(req.user, 'village.view').then(({ allowed }) => allowed)
        : Promise.resolve(jurisdiction.scope_type === 'taluka'),
      jurisdiction.scope_type !== 'village'
        ? checkPermission(req.user, 'user.view').then(({ allowed }) => allowed)
        : Promise.resolve(true),
      checkPermission(req.user, 'user.create').then(({ allowed }) => allowed),
      checkPermission(req.user, 'user.edit').then(({ allowed }) => allowed),
      checkPermission(req.user, 'user.delete').then(({ allowed }) => allowed),
    ]);

    if (jurisdiction.scope_type === 'district') {
      // If an admin has narrowed this rep down to a specific taluka subset, only show
      // those; otherwise (no subset configured yet) fall back to the whole district.
      const assignedTalukaIds = await getAssignedTalukaIdsForJurisdiction(jurisdiction.id);
      const talukaReps = assignedTalukaIds.length > 0
        ? await getTalukaRepsForTalukaIds(assignedTalukaIds)
        : await getTalukaRepsInDistrict(jurisdiction.scope_id);
      return res.status(200).json({
        scope_type: 'district',
        scope_label: scopeLabel,
        talukaReps,
        canViewVillageReps,
        canViewUsers,
        canCreateUsers,
        canEditUsers,
        canDeleteUsers,
      });
    }

    if (jurisdiction.scope_type === 'taluka') {
      // If an admin has narrowed this rep down to a specific village subset, only show
      // those; otherwise (no subset configured yet) fall back to the whole taluka.
      const assignedVillageIds = await getAssignedVillageIdsForJurisdiction(jurisdiction.id);
      const villageReps = assignedVillageIds.length > 0
        ? await getVillageRepsForVillageIds(assignedVillageIds)
        : await getVillageRepsInTaluka(jurisdiction.scope_id);
      return res.status(200).json({
        scope_type: 'taluka',
        scope_label: scopeLabel,
        villageReps,
        canViewVillageReps,
        canViewUsers,
        canCreateUsers,
        canEditUsers,
        canDeleteUsers,
      });
    }

    const users = await getUsersInVillage(scopeNames);
    return res.status(200).json({
      scope_type: 'village',
      scope_label: scopeLabel,
      users,
      canViewVillageReps,
      canViewUsers,
      canCreateUsers,
      canEditUsers,
      canDeleteUsers,
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

    const assignedTalukaIds = await getAssignedTalukaIdsForJurisdiction(jurisdiction.id);
    if (assignedTalukaIds.length > 0 && !assignedTalukaIds.includes(Number(taluka.id))) {
      return res.status(403).json({ message: 'This taluka is not assigned to you.' });
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

    if (jurisdiction.scope_type === 'district') {
      const assignedTalukaIds = await getAssignedTalukaIdsForJurisdiction(jurisdiction.id);
      if (assignedTalukaIds.length > 0 && !assignedTalukaIds.includes(Number(village.taluka_id))) {
        return res.status(403).json({ message: 'This village is not within your assigned talukas.' });
      }
    }

    if (jurisdiction.scope_type === 'taluka') {
      const assignedVillageIds = await getAssignedVillageIdsForJurisdiction(jurisdiction.id);
      if (assignedVillageIds.length > 0 && !assignedVillageIds.includes(Number(village.id))) {
        return res.status(403).json({ message: 'This village is not assigned to you.' });
      }
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
