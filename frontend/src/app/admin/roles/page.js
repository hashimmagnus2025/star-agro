
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Edit2, ShieldCheck, Eye } from 'lucide-react';


import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [permissionRole, setPermissionRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
  });
  const formRef = useRef(null);

  // Fetch roles and permissions on mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/role');
      const data = response.data;
      // Parse permissions string to array and convert numeric ids to numbers
      const rolesWithParsedPermissions = data.map(role => {
        const perms = role.permissions
          ? role.permissions.split(',').map(p => p.trim()).map(p => {
              const n = Number(p);
              return Number.isNaN(n) ? p : n;
            })
          : [];
        return { ...role, permissions: perms };
      });
      setRoles(rolesWithParsedPermissions);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permission');
      setPermissions(response.data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const isSuperAdminName = (name) => /^super[ _]?admin$/i.test((name || '').trim());
  const isSuperAdminForm = isSuperAdminName(formData.name);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && isSuperAdminName(value)) {
        next.permissions = permissions.map((p) => p.id);
      }
      return next;
    });
  };

  const handlePermissionChange = (permissionId) => {
    if (isSuperAdminForm) return; // super_admin always has every permission
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  };

  // Keep super_admin's permission set in sync if permissions list loads/changes after the name is set
  useEffect(() => {
    if (isSuperAdminForm && permissions.length > 0) {
      setFormData((prev) => {
        const allIds = permissions.map((p) => p.id);
        const same = prev.permissions.length === allIds.length && allIds.every((id) => prev.permissions.includes(id));
        return same ? prev : { ...prev, permissions: allIds };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdminForm, permissions]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.description.trim() && formData.permissions.length > 0) {
      try {
        const permissionsString = formData.permissions.join(',');
        const payload = {
          name: formData.name,
          description: formData.description,
          permissions: permissionsString,
        };

        if (editingId) {
          await api.put(`/role/${editingId}`, payload);
        } else {
          await api.post('/role', payload);
        }

        // Refresh roles list
        await fetchRoles();
        closeForm();
      } catch (err) {
        setError(err.message);
        console.error('Error saving role:', err);
      }
    } else {
      setError('Please fill all fields and select at least one permission');
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', permissions: [] });
    setError('');
    setShowForm(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleEditRole = (role) => {
    setEditingId(role.id);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
    });
    setError('');
    setShowForm(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleDeleteRole = async (id) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await api.delete(`/role/${id}`);
      setRoles((prev) => prev.filter((role) => role.id !== id));
      if (editingId === id) closeForm();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting role:', err);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', permissions: [] });
    setError('');
  };

  const filteredRoles = roles.filter((role) => {
    const term = searchTerm.toLowerCase();
    return [role.name, role.description, ...(Array.isArray(role.permissions) ? role.permissions : [])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / itemsPerPage));
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (!permissionRole) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPermissionRole(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [permissionRole]);

  const getRolePermissionItems = (role) => {
    const rolePermissions = isSuperAdminName(role.name)
      ? permissions.map((permission) => permission.id)
      : Array.isArray(role.permissions) ? role.permissions : [];

    return rolePermissions.map((permissionId) => {
      const permission = permissions.find((item) => item.id === permissionId || item.id === Number(permissionId));
      return permission || { id: permissionId, name: String(permissionId), description: '' };
    });
  };
  const selectedRolePermissions = permissionRole ? getRolePermissionItems(permissionRole) : [];

  return (
    <div className="p-4">
      {/* Header with Create Button */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Roles Management</h1>
        </div>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition"
          >
            <Plus size={20} />
            Add Role
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-6 py-4 text-red-700">
          {error}
        </div>
      )}

      {/* Inline Add/Edit Form */}
      {showForm && (
        <div ref={formRef} className="mb-8 rounded-3xl bg-white shadow-sm border border-emerald-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-5 text-white sm:px-8">
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} />
              <h2 className="text-xl font-bold sm:text-2xl">
                {editingId ? 'Edit Role' : 'Add New Role'}
              </h2>
            </div>
            <button
              onClick={closeForm}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/20 transition"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleCreateRole} className="p-6 space-y-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Role Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Role Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Manager, Supervisor, Moderator"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this role does..."
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-4">
                Permissions <span className="text-red-600">*</span>
              </label>
              {isSuperAdminForm && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <ShieldCheck size={16} />
                  Super Admin always has full access to every permission — this cannot be restricted.
                </div>
              )}
              {permissions.length === 0 ? (
                <p className="text-slate-500 text-sm">No permissions available. Please create permissions first.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {permissions.map((permission) => {
                    const checked = isSuperAdminForm || formData.permissions.includes(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                          isSuperAdminForm ? 'cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isSuperAdminForm}
                          onChange={() => handlePermissionChange(permission.id)}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{permission.name}</p>
                          <p className="text-xs text-slate-600">{permission.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 pt-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border border-slate-300 px-8 py-3 text-slate-900 font-semibold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition"
              >
                {editingId ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roles List */}
      {!showForm && (
      <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">Showing {filteredRoles.length} result{filteredRoles.length === 1 ? '' : 's'}</div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search roles..."
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">Loading roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              {roles.length === 0 ? 'No roles created yet. Add your first role!' : 'No roles match your search.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Permissions</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoles.map((role) => (
                    <tr key={role.id} className="bg-slate-50/70 hover:bg-emerald-50/60 transition">
                      <td className="px-4 py-4 align-top rounded-l-2xl">
                        <span className="font-semibold text-slate-900">{role.name}</span>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600 max-w-xs">
                        {role.description}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => setPermissionRole(role)}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
                        >
                          <Eye size={16} />
                          View permissions
                        </button>
                      </td>
                      <td className="px-4 py-4 align-top rounded-r-2xl">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-red-300 bg-white text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-4 sm:hidden">
              {paginatedRoles.map((role) => (
                <div key={role.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{role.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{role.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-red-300 bg-white text-red-600 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionRole(role)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <Eye size={16} />
                    View permissions
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRoles.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
      )}
      {permissionRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setPermissionRole(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-permissions-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 id="role-permissions-title" className="text-xl font-bold text-slate-900">
                  {permissionRole.name} Permissions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedRolePermissions.length} permission{selectedRolePermissions.length === 1 ? '' : 's'} assigned
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPermissionRole(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close permissions"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[calc(85vh-100px)] overflow-y-auto p-6">
              {selectedRolePermissions.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedRolePermissions.map((permission) => (
                    <div key={permission.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{permission.name}</p>
                      {permission.description && (
                        <p className="mt-1 text-sm text-slate-600">{permission.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">No permissions assigned to this role.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
