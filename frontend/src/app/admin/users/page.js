
"use client"
import { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '';

const getMediaUrl = (value) => {
  const path = String(value || '').trim();
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${IMAGE_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
};

const representativeRoleNames = new Set([
  'districtrepresentative',
  'talukarepresentative',
  'villagerepresentative',
]);

const isRepresentativeRole = (roleName) =>
  representativeRoleNames.has(String(roleName || '').toLowerCase().replace(/[^a-z]/g, ''));

export default function AdminUsersPage() {

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);
  const usersPerPage = 10;

  const [showJurisdictionModal, setShowJurisdictionModal] = useState(false);
  const [jurisdictionUser, setJurisdictionUser] = useState(null);
  const [jurisdictionForm, setJurisdictionForm] = useState({ role_name: '', scope_type: 'district' });
  const [jurisdictionSubmitting, setJurisdictionSubmitting] = useState(false);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villages, setVillages] = useState([]);
  const [locationIds, setLocationIds] = useState({ state_id: '', district_id: '', taluka_id: '', village_id: '' });
  const mainRoleOptions = roles.filter((role) => !isRepresentativeRole(role.name));

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchIndiaStates = async () => {
      try {
        const countriesRes = await api.get('/countries');
        const india = countriesRes.data.find((c) => c.iso2 === 'IN' || c.name === 'India');
        if (!india) return;
        const statesRes = await api.get(`/states?country_id=${india.id}`);
        setStates(statesRes.data);
      } catch (error) {
        console.error('Failed to load states', error);
      }
    };
    fetchIndiaStates();
  }, []);

  useEffect(() => {
    if (!locationIds.state_id) {
      setDistricts([]);
      return;
    }
    api.get(`/districts?state_id=${locationIds.state_id}`)
      .then((res) => setDistricts(res.data))
      .catch((error) => { console.error('Failed to load districts', error); setDistricts([]); });
  }, [locationIds.state_id]);

  useEffect(() => {
    if (!locationIds.district_id) {
      setTalukas([]);
      return;
    }
    api.get(`/talukas?district_id=${locationIds.district_id}`)
      .then((res) => setTalukas(res.data))
      .catch((error) => { console.error('Failed to load talukas', error); setTalukas([]); });
  }, [locationIds.district_id]);

  useEffect(() => {
    if (!locationIds.taluka_id) {
      setVillages([]);
      return;
    }
    api.get(`/villages?taluka_id=${locationIds.taluka_id}`)
      .then((res) => setVillages(res.data))
      .catch((error) => { console.error('Failed to load villages', error); setVillages([]); });
  }, [locationIds.taluka_id]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/role');
      const data = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleChangeRole = async (user, newRole) => {
    if (!newRole || newRole === user.role) return;
    const previousRole = user.role;
    setRoleUpdatingId(user.id);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    try {
      await api.put(`/user/${user.id}`, { role: newRole });
      setAdminMessage('User role updated successfully.');
      setAdminError('');
    } catch (error) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: previousRole } : u)));
      setAdminError(error?.response?.data?.message || 'Unable to update role.');
      setAdminMessage('');
      Swal.fire({
        title: 'Update failed',
        text: error?.response?.data?.message || 'Unable to update role.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const normalizedPhoneSearchTerm = normalizedSearchTerm.replace(/\D/g, '');
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearchTerm) return true;

    const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const searchableText = [
      name,
      user.email,
      user.role,
      user.jurisdiction_label,
      user.jurisdiction_role_name,
    ];
    const phone = String(user.phone || '');
    const matchesText = searchableText.some((value) =>
      String(value || '').toLowerCase().includes(normalizedSearchTerm)
    );
    const matchesPhone = phone.toLowerCase().includes(normalizedSearchTerm)
      || (normalizedPhoneSearchTerm && phone.replace(/\D/g, '').includes(normalizedPhoneSearchTerm));

    return matchesText || matchesPhone;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const fetchUsers = async () => {
    try {
      const response = await api.get('/user');
      setUsers(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(1);
      setAdminError('');
    } catch (error) {
      setAdminError('Unable to load users.');
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      first_name: user.first_name || user.name?.split(' ')[0] || '',
      last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setAdminMessage('');
    setAdminError('');
    setShowEditModal(true);
  };

  const formatUserDetailLabel = (key) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

  const formatUserDetailValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const handleViewUser = (user) => {
    setProfileImageFailed(false);
    setViewUser(user);
  };

  const handleCloseEdit = () => {
    setSelectedUser(null);
    setShowEditModal(false);
    setAdminError('');
    setAdminMessage('');
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone,
      };

      await api.put(`/user/${selectedUser.id}`, payload);
      setAdminMessage('User updated successfully.');
      setAdminError('');
      handleCloseEdit();
      await fetchUsers();
      Swal.fire({
        title: 'Saved!',
        text: 'User details updated successfully.',
        icon: 'success',
        confirmButtonColor: '#059669',
      });
    } catch (error) {
      setAdminError(error?.response?.data?.message || 'Unable to update user.');
      setAdminMessage('');
      console.error('Error updating user:', error);
      Swal.fire({
        title: 'Update failed',
        text: error?.response?.data?.message || 'Unable to update user.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    const result = await Swal.fire({
      title: 'Delete user? 🗑️',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e11d48',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await api.delete(`/user/${userId}`);
      setAdminMessage('User deleted successfully.');
      setAdminError('');
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      Swal.fire({
        title: 'Deleted!',
        text: 'The user has been removed.',
        icon: 'success',
        confirmButtonColor: '#059669',
      });
    } catch (error) {
      setAdminError(error?.response?.data?.message || 'Unable to delete user.');
      setAdminMessage('');
      console.error('Error deleting user:', error);
      Swal.fire({
        title: 'Delete failed',
        text: error?.response?.data?.message || 'Unable to delete user.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleOpenJurisdiction = (user) => {
    setJurisdictionUser(user);
    setJurisdictionForm({ role_name: user.jurisdiction_role_name || '', scope_type: 'district' });
    setLocationIds({ state_id: '', district_id: '', taluka_id: '', village_id: '' });
    setShowJurisdictionModal(true);
  };

  const handleCloseJurisdiction = () => {
    setShowJurisdictionModal(false);
    setJurisdictionUser(null);
  };

  const scopeIdForSubmit = () => {
    if (jurisdictionForm.scope_type === 'district') return locationIds.district_id;
    if (jurisdictionForm.scope_type === 'taluka') return locationIds.taluka_id;
    return locationIds.village_id;
  };

  const handleAssignJurisdiction = async (e) => {
    e.preventDefault();
    if (!jurisdictionUser) return;
    const scope_id = scopeIdForSubmit();
    if (!jurisdictionForm.role_name || !scope_id) {
      Swal.fire({ title: 'Missing fields', text: 'Please select a role and a location.', icon: 'warning' });
      return;
    }

    setJurisdictionSubmitting(true);
    try {
      await api.put(`/jurisdictions/${jurisdictionUser.id}`, {
        role_name: jurisdictionForm.role_name,
        scope_type: jurisdictionForm.scope_type,
        scope_id,
      });
      handleCloseJurisdiction();
      await fetchUsers();
      Swal.fire({ title: 'Assigned!', text: 'Representative role assigned successfully.', icon: 'success', confirmButtonColor: '#059669' });
    } catch (error) {
      Swal.fire({
        title: 'Assign failed',
        text: error?.response?.data?.message || 'Unable to assign representative role.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setJurisdictionSubmitting(false);
    }
  };

  const handleRemoveJurisdiction = async (user) => {
    const result = await Swal.fire({
      title: 'Remove representative role?',
      text: `This will remove ${user.jurisdiction_label || 'the representative role'} from ${user.name || user.email}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e11d48',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/jurisdictions/${user.id}`);
      await fetchUsers();
      Swal.fire({ title: 'Removed', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({
        title: 'Remove failed',
        text: error?.response?.data?.message || 'Unable to remove representative role.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">User management</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Users panel</h1>
            <p className="mt-2 text-sm text-slate-600">Manage active accounts, approve pending requests, and review registrations.</p>
          </div>
        </div>
      </section>



      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Recent users</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Latest registrations</h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, phone, or role..."
              aria-label="Search users by name, email, phone, role, or representative role"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-80"
            />
            
          </div>
        </div>

        <div className="overflow-x-auto">
          {adminMessage && (
            <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              {adminMessage}
            </div>
          )}
          {adminError && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {adminError}
            </div>
          )}
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="hidden sm:table-header-group border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 pr-6">Name</th>
                <th className="py-3 pr-6">Role</th>
                <th className="py-3 pr-6">Phone</th>
                <th className="py-3 pr-6">Email</th>
                <th className="py-3 pr-6">Status</th>
                <th className="py-3 pr-6">Representative Role</th>
                <th className="py-3 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id || user.email} className={`block sm:table-row border-b border-slate-200 hover:bg-slate-50`}>
                  <td className="block sm:table-cell py-4 pr-6 align-top">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Name</span>
                    <span className="font-semibold text-slate-900">{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}</span>
                  </td>
                  <td className="block sm:table-cell py-4 pr-6 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Role</span>
                    <select
                      value={user.role || 'user'}
                      disabled={roleUpdatingId === user.id}
                      onChange={(e) => handleChangeRole(user, e.target.value)}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold capitalize text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                    >
                      {!mainRoleOptions.some((role) => role.name === (user.role || 'user')) && (
                        <option value={user.role || 'user'} disabled={isRepresentativeRole(user.role)}>
                          {isRepresentativeRole(user.role) ? 'Representative role (manage separately)' : user.role || 'user'}
                        </option>
                      )}
                      {mainRoleOptions.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="block sm:table-cell py-4 pr-6 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Phone</span>
                    {user.phone || 'N/A'}
                  </td>
                  <td className="block sm:table-cell py-4 pr-6 align-top text-slate-600 break-all">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Email</span>
                    {user.email}
                  </td>
                  <td className="block sm:table-cell py-4 pr-6 align-top">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Status</span>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span>
                  </td>
                  <td className="block sm:table-cell py-4 pr-6 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Representative Role</span>
                    {user.jurisdiction_label || '—'}
                  </td>
                  <td className="block sm:table-cell py-4 align-top">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Actions</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewUser(user)}
                        aria-label={`View details for ${user.name || user.email || 'user'}`}
                        title="View user details"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(user)}
                        className="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenJurisdiction(user)}
                        className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                      >
                        {user.jurisdiction_label ? 'Change Role' : 'Assign Role'}
                      </button>
                      {user.jurisdiction_label && (
                        <button
                          type="button"
                          onClick={() => handleRemoveJurisdiction(user)}
                          className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition"
                        >
                          Remove Role
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr className="block sm:table-row">
                  <td colSpan="7" className="block sm:table-cell py-8 text-center text-slate-500">
                    {users.length === 0 ? 'No users found or loading...' : 'No users match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={usersPerPage}
          onPageChange={setCurrentPage}
        />
      </section>

      {viewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewUser(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 id="user-details-title" className="text-xl font-bold text-slate-900">
                  User details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {viewUser.name || `${viewUser.first_name || ''} ${viewUser.last_name || ''}`.trim() || viewUser.email || 'User information'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewUser(null)}
                aria-label="Close user details"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[calc(85vh-88px)] overflow-y-auto p-6">
              <div className="mb-6 flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Profile Image</p>
                {viewUser.profile_image && !profileImageFailed ? (
                  <img
                    src={getMediaUrl(viewUser.profile_image)}
                    alt={`${viewUser.name || 'User'} profile`}
                    onError={() => setProfileImageFailed(true)}
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-slate-200 text-sm text-slate-500 shadow-md">
                    {viewUser.profile_image ? 'Image unavailable' : 'No image'}
                  </div>
                )}
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(viewUser)
                  .filter(([key]) => !/(password|token|secret|profile_image)/i.test(key))
                  .map(([key, value]) => (
                    <div key={key} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {formatUserDetailLabel(key)}
                      </dt>
                      <dd className="mt-1 break-words text-sm text-slate-900">
                        {key.toLowerCase() === 'document_file' && value ? (
                          <a
                            href={getMediaUrl(value)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            View
                          </a>
                        ) : (
                          formatUserDetailValue(value)
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          </section>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Edit user</h3>
                <p className="text-sm text-slate-500">Change role, email, phone and name.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSaveUser}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">First name</span>
                  <input
                    name="first_name"
                    value={editForm.first_name}
                    onChange={handleEditFormChange}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Last name</span>
                  <input
                    name="last_name"
                    value={editForm.last_name}
                    onChange={handleEditFormChange}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Phone</span>
                  <input
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditFormChange}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>


              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:shadow-xl transition"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJurisdictionModal && jurisdictionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Assign representative role</h3>
                <p className="text-sm text-slate-500">
                  {jurisdictionUser.name || jurisdictionUser.email} will get an additional, location-scoped role on top of their current role.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseJurisdiction}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleAssignJurisdiction}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Role</span>
                  <select
                    value={jurisdictionForm.role_name}
                    onChange={(e) => setJurisdictionForm((prev) => ({ ...prev, role_name: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Select role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Scope level</span>
                  <select
                    value={jurisdictionForm.scope_type}
                    onChange={(e) => {
                      setJurisdictionForm((prev) => ({ ...prev, scope_type: e.target.value }));
                      setLocationIds({ state_id: '', district_id: '', taluka_id: '', village_id: '' });
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="district">District</option>
                    <option value="taluka">Taluka</option>
                    <option value="village">Village</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">State</span>
                  <select
                    value={locationIds.state_id}
                    onChange={(e) => setLocationIds({ state_id: e.target.value, district_id: '', taluka_id: '', village_id: '' })}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">District</span>
                  <select
                    value={locationIds.district_id}
                    onChange={(e) => setLocationIds((prev) => ({ ...prev, district_id: e.target.value, taluka_id: '', village_id: '' }))}
                    disabled={!locationIds.state_id || districts.length === 0}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.district_name}</option>
                    ))}
                  </select>
                </label>
              </div>

              {jurisdictionForm.scope_type !== 'district' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Taluka</span>
                    <select
                      value={locationIds.taluka_id}
                      onChange={(e) => setLocationIds((prev) => ({ ...prev, taluka_id: e.target.value, village_id: '' }))}
                      disabled={!locationIds.district_id || talukas.length === 0}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Select Taluka</option>
                      {talukas.map((t) => (
                        <option key={t.id} value={t.id}>{t.taluka_name}</option>
                      ))}
                    </select>
                  </label>
                  {jurisdictionForm.scope_type === 'village' && (
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Village</span>
                      <select
                        value={locationIds.village_id}
                        onChange={(e) => setLocationIds((prev) => ({ ...prev, village_id: e.target.value }))}
                        disabled={!locationIds.taluka_id || villages.length === 0}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Select Village</option>
                        {villages.map((v) => (
                          <option key={v.id} value={v.id}>{v.village_name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseJurisdiction}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={jurisdictionSubmitting}
                  className="rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:shadow-xl transition disabled:opacity-60"
                >
                  {jurisdictionSubmitting ? 'Assigning...' : 'Assign role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
