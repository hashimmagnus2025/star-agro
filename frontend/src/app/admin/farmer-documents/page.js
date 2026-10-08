"use client"
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Eye, Check, Ban } from 'lucide-react';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function FarmerDocumentspage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user');
      const allUsers = Array.isArray(response.data.data) ? response.data.data : [];
      setUsers(allUsers.filter((u) => u.document_file));
      setCurrentPage(1);
      setError('');
    } catch (err) {
      setError('Unable to load farmer documents.');
      console.error('Error fetching farmer documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/user/${id}/document-status`, { status });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, document_status: status } : u)));
      Swal.fire({
        icon: 'success',
        title: status === 'Verified' ? 'Verified' : 'Rejected',
        text: status === 'Verified' ? 'The document has been verified.' : 'The document has been rejected.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: err?.response?.data?.message || 'Error updating document status',
        confirmButtonText: 'OK',
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'all') return true;
    return String(u.document_status || 'Pending').toLowerCase() === statusFilter.toLowerCase();
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4">
      <div className="flex flex-col gap-6 mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Farmer Documents</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {['all', 'Pending', 'Verified', 'Rejected'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { setStatusFilter(option); setCurrentPage(1); }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusFilter === option ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {option === 'all' ? 'All Status' : option}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-6 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl bg-white p-8 shadow-sm overflow-x-auto">
        <div className="mb-4 text-sm text-slate-500">
          Showing {filteredUsers.length} result{filteredUsers.length === 1 ? '' : 's'}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">Loading documents...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No farmer documents found.</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b-2 border-slate-300 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Document</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`block sm:table-row border-b border-slate-200 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <td className="block sm:table-cell px-6 py-4 align-top">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Name</span>
                    <span className="font-semibold text-slate-900">
                      {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                    </span>
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-slate-600 break-all">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Email</span>
                    {user.email || 'N/A'}
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Phone</span>
                    {user.phone || 'N/A'}
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-center">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Document</span>
                    <a
                      href={resolveMediaUrl(user.document_file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-100 transition text-sm font-medium"
                    >
                      <Eye size={16} />
                      View
                    </a>
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-center">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Status</span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      String(user.document_status).toLowerCase() === 'verified'
                        ? 'bg-emerald-100 text-emerald-700'
                        : String(user.document_status).toLowerCase() === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {user.document_status || 'Pending'}
                    </span>
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-center">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Actions</span>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {String(user.document_status).toLowerCase() !== 'verified' && (
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'Verified')}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition"
                          title="Verify"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {String(user.document_status).toLowerCase() !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'Rejected')}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                          title="Reject"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
