"use client"
import { useEffect, useState } from 'react';
import { Eye, Download, X, Briefcase } from 'lucide-react';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function AdminJobApplicationPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        let mounted = true;
        const fetchApplications = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await api.get('/jobs');
                if (!mounted) return;
                setApplications(Array.isArray(response.data) ? response.data : []);
            } catch (fetchError) {
                console.error('Error fetching job applications:', fetchError);
                if (!mounted) return;
                setError(fetchError?.response?.data?.message || fetchError.message || 'Unable to load job applications');
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };
        fetchApplications();
        return () => { mounted = false; };
    }, []);

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString();
    };

    const getAddress = (application) => {
        return [application.village, application.taluka, application.district, application.state]
            .filter(Boolean)
            .join(', ') || '-';
    };

    const filteredApplications = applications.filter((application) => {
        const term = searchTerm.toLowerCase();
        return [
            application.first_name,
            application.last_name,
            application.email,
            application.phone,
            application.applying_for,
            application.state,
            application.district,
            application.taluka,
            application.village,
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term));
    });

    const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));
    const paginatedApplications = filteredApplications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6 p-4">
            <div>
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">Job Applications</h1>
                <p className="mt-2 text-slate-500">Review applications submitted through the job application form.</p>
            </div>

            {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-4 text-red-700">
                    {error}
                </div>
            )}

            <div className="rounded-3xl bg-white p-8 shadow-sm overflow-x-auto">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">Showing {filteredApplications.length} result{filteredApplications.length === 1 ? '' : 's'}</div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Search applicants..."
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-16 text-slate-500">Loading applications...</div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">No job applications found yet.</div>
                ) : (
                    <table className="w-full min-w-full border-collapse text-sm">
                        <thead className="hidden sm:table-header-group">
                            <tr className="border-b-2 border-slate-300 bg-slate-50 text-left text-slate-900">
                                <th className="px-6 py-4 font-semibold">First Name</th>
                                <th className="px-6 py-4 font-semibold">Last Name</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Phone</th>
                                <th className="px-6 py-4 font-semibold">Address</th>
                                <th className="px-6 py-4 font-semibold">Applying For</th>
                                <th className="px-6 py-4 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedApplications.map((application, index) => (
                                <tr
                                    key={application.id || index}
                                    className={`block sm:table-row border-b border-slate-200 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                >
                                    <td className="block sm:table-cell px-6 py-4 align-top">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">First Name</span>
                                        <span className="font-semibold text-slate-900">{application.first_name || '-'}</span>
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Last Name</span>
                                        {application.last_name || '-'}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600 break-all">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Email</span>
                                        {application.email || '-'}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Phone</span>
                                        {application.phone || '-'}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600 max-w-xs break-words">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Address</span>
                                        {getAddress(application)}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Applying For</span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            <Briefcase size={12} />
                                            {application.applying_for || '-'}
                                        </span>
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-center">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Actions</span>
                                        <div className="flex flex-wrap items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedApplication(application)}
                                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {application.cv_file ? (
                                                <a
                                                    href={resolveMediaUrl(application.cv_file)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download
                                                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition"
                                                    title="Download CV"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            ) : (
                                                <span
                                                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"
                                                    title="No CV uploaded"
                                                >
                                                    <Download size={16} />
                                                </span>
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
                    totalItems={filteredApplications.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {selectedApplication && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedApplication(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Applicant</p>
                                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                    {selectedApplication.first_name} {selectedApplication.last_name}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedApplication(null)}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email</p>
                                    <p className="mt-1 text-slate-800 break-all">{selectedApplication.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Phone</p>
                                    <p className="mt-1 text-slate-800">{selectedApplication.phone || '-'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Address</p>
                                <p className="mt-1 text-slate-800">{getAddress(selectedApplication)}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Applying For</p>
                                <p className="mt-1">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        <Briefcase size={12} />
                                        {selectedApplication.applying_for || '-'}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Subject</p>
                                <p className="mt-1 text-slate-800">{selectedApplication.subject || '-'}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Description</p>
                                <p className="mt-1 text-slate-800 whitespace-pre-wrap break-words">{selectedApplication.description || '-'}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Submitted</p>
                                <p className="mt-1 text-slate-800">{formatDate(selectedApplication.created_at)}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            {selectedApplication.cv_file && (
                                <a
                                    href={resolveMediaUrl(selectedApplication.cv_file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-xl transition"
                                >
                                    <Download size={16} />
                                    Download CV
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
