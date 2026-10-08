'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, ArrowLeft, Eye, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';

const emptyUserForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
};

export default function MyTeamPage() {
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState({ scope_type: null });
  const [selectedTaluka, setSelectedTaluka] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [villageTeam, setVillageTeam] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyUserForm);
  const [submitting, setSubmitting] = useState(false);

  const t = translations[language]?.userPanel?.myTeam || translations.en.userPanel.myTeam;

  useEffect(() => {
    const syncLanguage = () => {
      const savedLanguage = localStorage.getItem('language') || 'en';
      setLanguage(translations[savedLanguage] ? savedLanguage : 'en');
    };

    syncLanguage();
    window.addEventListener('storage', syncLanguage);
    fetchTeam();

    return () => window.removeEventListener('storage', syncLanguage);
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jurisdictions/my-team');
      setTeam(response.data || { scope_type: null });
    } catch (error) {
      console.error('Error fetching my team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTaluka = async (talukaRep) => {
    setDrilldownLoading(true);
    try {
      const response = await api.get(`/jurisdictions/my-team/talukas/${talukaRep.taluka_id}`);
      setSelectedTaluka(response.data);
      setSelectedVillage(null);
      setVillageTeam(null);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: t.unableToOpenTaluka,
        text: error?.response?.data?.message || t.loadVillageRepsFailed,
      });
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleOpenVillage = async (village) => {
    setDrilldownLoading(true);
    try {
      const response = await api.get(`/jurisdictions/my-team/villages/${village.village_id}`);
      setSelectedVillage(village);
      setVillageTeam(response.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: t.unableToOpenVillage,
        text: error?.response?.data?.message || t.loadVillageUsersFailed,
      });
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleGoBack = () => {
    if (selectedVillage) {
      setSelectedVillage(null);
      setVillageTeam(null);
    } else if (selectedTaluka) {
      setSelectedTaluka(null);
    }
  };

  const visibleVillageReps = selectedTaluka?.villageReps || team.villageReps || [];
  const missingTeamPermissions = [];
  if (team.scope_type === 'district' && !team.canViewVillageReps) {
    missingTeamPermissions.push(t.villageViewPermission);
  }
  if (team.scope_type !== 'village' && !team.canViewUsers) {
    missingTeamPermissions.push(t.userViewPermission);
  }

  const resetForm = () => {
    setFormData(emptyUserForm);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingId(user.id);
    setFormData({
      first_name: user.first_name || user.name?.split(' ')[0] || '',
      last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/user/${editingId}`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
        });
      } else {
        await api.post('/user', formData);
      }
      closeModal();
      await fetchTeam();
      Swal.fire({
        icon: 'success',
        title: editingId ? t.updated : t.created,
        text: editingId ? t.userUpdated : t.userAdded,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: editingId ? t.updateFailed : t.createFailed,
        text: error?.response?.data?.message || t.somethingWentWrong,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t.confirmDelete,
      text: t.deleteMessage.replace('{user}', user.name || user.email),
      showCancelButton: true,
      confirmButtonText: t.confirmDeleteButton,
      cancelButtonText: t.cancel,
      confirmButtonColor: '#d33',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/user/${user.id}`);
      setTeam((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== user.id) }));
      Swal.fire({ icon: 'success', title: t.deleted, timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: t.deleteFailed,
        text: error?.response?.data?.message || t.deleteUserFailed,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t.loading}
      </div>
    );
  }

  if (!team.scope_type) {
    return (
      <div className="w-full min-h-screen bg-slate-50 p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          {t.noRole}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6 lg:p-2">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-slate-900">{t.myTeam}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{team.scope_label}</span>
            {selectedTaluka && (
              <>
                <span>/</span>
                <span>{selectedTaluka.taluka_name}</span>
              </>
            )}
            {selectedVillage && (
              <>
                <span>/</span>
                <span>{selectedVillage.village_name}</span>
              </>
            )}
          </div>
        </div>

        {(selectedTaluka || selectedVillage) && (
          <button
            type="button"
            onClick={handleGoBack}
            disabled={drilldownLoading}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            {selectedVillage ? t.backToVillageReps : t.backToTalukas}
          </button>
        )}

        {missingTeamPermissions.length > 0 && (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t.askAdmin.replace('{permissions}', missingTeamPermissions.join(language === 'hi' ? ' और ' : language === 'mr' ? ' आणि ' : ' and '))}
          </p>
        )}

        {drilldownLoading && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Loader2 className="h-4 w-4 animate-spin" /> {t.loadingMembers}
          </div>
        )}

        {selectedVillage && villageTeam && (
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-4">
              <Users size={18} className="text-emerald-600" />
              <h3 className="font-semibold text-slate-900">
                {t.usersInVillage.replace('{village}', villageTeam.village_name).replace('{count}', villageTeam.users?.length || 0)}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-slate-200 bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.name}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.role}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.phone}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.email}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.documentStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {(villageTeam.users || []).map((user) => (
                    <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm capitalize text-slate-600">{user.role || t.defaultUser}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.email || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.document_status || '-'}</td>
                    </tr>
                  ))}
                  {(!villageTeam.users || villageTeam.users.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">{t.noUsersInVillage}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedVillage && team.scope_type === 'district' && !selectedTaluka && (
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.name}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.phone}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.taluka}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{t.villageReps}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {(team.talukaReps || []).map((rep) => (
                  <tr key={rep.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{rep.name || `${rep.first_name || ''} ${rep.last_name || ''}`.trim()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{rep.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{rep.taluka_name}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">{rep.village_rep_count}</td>
                    <td className="px-6 py-4 text-center">
                      {team.canViewVillageReps && (
                        <button
                          type="button"
                          onClick={() => handleOpenTaluka(rep)}
                          disabled={drilldownLoading}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <Eye size={15} /> {t.viewVillageReps}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(!team.talukaReps || team.talukaReps.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">{t.noTalukaReps}</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {!selectedVillage && (selectedTaluka || team.scope_type === 'taluka') && (
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.name}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.phone}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.village}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {visibleVillageReps.map((rep) => (
                  <tr key={rep.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{rep.name || `${rep.first_name || ''} ${rep.last_name || ''}`.trim()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{rep.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{rep.village_name}</td>
                    <td className="px-6 py-4 text-center">
                      {team.canViewUsers && (
                        <button
                          type="button"
                          onClick={() => handleOpenVillage(rep)}
                          disabled={drilldownLoading}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <Eye size={15} /> {t.viewUsers}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {visibleVillageReps.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">{t.noVillageReps}</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {team.scope_type === 'village' && !selectedVillage && (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleAddUser}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold hover:shadow-lg transition text-sm sm:text-base"
              >
                <Plus size={18} />
                <span>{t.addUser}</span>
              </button>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.name}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.phone}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.email}</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{t.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {(team.users || []).map((u) => (
                    <tr key={u.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim()}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.email || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => handleEditUser(u)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition" title={t.edit}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteUser(u)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition" title={t.delete}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!team.users || team.users.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">{t.noVillageUsers}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="rounded-2xl sm:rounded-3xl bg-white shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-8 py-4 sm:py-6 text-white">
              <h2 className="text-lg sm:text-2xl font-bold">{editingId ? t.editUser : t.addUser}</h2>
              <button onClick={closeModal} className="inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/20 transition">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">{t.firstName} <span className="text-red-600">*</span></label>
                  <input
                    type="text" name="first_name" required
                    value={formData.first_name} onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">{t.lastName}</label>
                  <input
                    type="text" name="last_name"
                    value={formData.last_name} onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">{t.email} <span className="text-red-600">*</span></label>
                <input
                  type="email" name="email" required
                  value={formData.email} onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">{t.phone}</label>
                <input
                  type="text" name="phone"
                  value={formData.phone} onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">{t.password} <span className="text-red-600">*</span></label>
                  <input
                    type="password" name="password" required minLength={6}
                    value={formData.password} onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 justify-end pt-4 border-t border-slate-200">
                <button type="button" onClick={closeModal} className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting} className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-lg transition disabled:opacity-60">
                  {submitting ? (editingId ? t.updating : t.creating) : (editingId ? t.updateUser : t.addUser)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
