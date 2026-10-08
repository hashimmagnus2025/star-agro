'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '';
const STATUS_FILTERS = ['all', 'Pending', 'Approved', 'Rejected'];

const getMediaUrl = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${IMAGE_BASE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
};

const statusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'bg-emerald-100 text-emerald-700';
  if (normalized === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      setServices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching services:', error);
      Swal.fire({ icon: 'error', title: 'Load Failed', text: error?.response?.data?.message || 'Unable to load services.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const updateStatus = async (id, status) => {
    const action = status === 'Approved' ? 'approve' : 'reject';
    const result = await Swal.fire({
      icon: status === 'Approved' ? 'question' : 'warning',
      title: `${status} service?`,
      text: `Are you sure you want to ${action} this service?`,
      showCancelButton: true,
      confirmButtonText: status === 'Approved' ? 'Approve' : 'Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: status === 'Approved' ? '#059669' : '#dc2626',
    });
    if (!result.isConfirmed) return;

    try {
      setProcessingId(id);
      await api.put(`/services/${id}/status`, { status });
      setServices((previous) => previous.map((service) => (
        service.id === id ? { ...service, status } : service
      )));
      if (selectedService?.id === id) {
        setSelectedService((previous) => ({ ...previous, status }));
      }
      Swal.fire({
        icon: 'success',
        title: status === 'Approved' ? 'Service Approved' : 'Service Rejected',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Action Failed', text: error?.response?.data?.message || error.message || 'Unable to update status.' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredServices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return services.filter((service) => {
      const matchesStatus = statusFilter === 'all' || String(service.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();
      const searchable = [service.name, service.service_type, service.provider_name, service.contact_number, service.coverage_area]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesStatus && searchable.includes(normalizedSearch);
    });
  }, [services, statusFilter, searchTerm]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Services Approval</h1>
        <p className="mt-2 text-slate-500">Review farmer services and approve or reject submissions.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusFilter === filter ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search services..."
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 lg:max-w-xs"
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No services found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{service.name}</p>
                      <p className="mt-1 max-w-xs truncate text-slate-500">{service.description || 'No description'}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{service.provider_name || 'Unknown provider'}</td>
                    <td className="px-4 py-4 text-slate-600">{service.service_type || '-'}</td>
                    <td className="px-4 py-4 text-slate-600">{service.price ? `Rs. ${service.price} ${service.price_unit || ''}` : '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(service.status)}`}>
                        {service.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setSelectedService(service)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100" title="View details">
                          <Eye size={16} />
                        </button>
                        {String(service.status).toLowerCase() !== 'approved' && (
                          <button type="button" disabled={processingId === service.id} onClick={() => updateStatus(service.id, 'Approved')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50" title="Approve">
                            <Check size={16} />
                          </button>
                        )}
                        {String(service.status).toLowerCase() !== 'rejected' && (
                          <button type="button" disabled={processingId === service.id} onClick={() => updateStatus(service.id, 'Rejected')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50" title="Reject">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedService(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedService.name}</h2>
                <p className="mt-1 text-slate-500">{selectedService.service_type} service</p>
              </div>
              <button type="button" onClick={() => setSelectedService(null)} className="text-slate-500 hover:text-slate-900" aria-label="Close details"><X /></button>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <p><strong>Provider:</strong> {selectedService.provider_name || 'Unknown provider'}</p>
              <p><strong>Contact:</strong> {selectedService.contact_number || '-'}</p>
              <p><strong>Coverage:</strong> {selectedService.coverage_area || '-'}</p>
              <p><strong>Price:</strong> {selectedService.price ? `Rs. ${selectedService.price} ${selectedService.price_unit || ''}` : '-'}</p>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-slate-600">{selectedService.description || 'No description.'}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {selectedService.image_url && <img src={getMediaUrl(selectedService.image_url)} alt={selectedService.name} className="h-56 w-full rounded-2xl object-cover" />}
              {selectedService.video_url && <video src={getMediaUrl(selectedService.video_url)} controls className="h-56 w-full rounded-2xl bg-black object-contain" />}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              {String(selectedService.status).toLowerCase() !== 'approved' && <button type="button" disabled={processingId === selectedService.id} onClick={() => updateStatus(selectedService.id, 'Approved')} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>}
              {String(selectedService.status).toLowerCase() !== 'rejected' && <button type="button" disabled={processingId === selectedService.id} onClick={() => updateStatus(selectedService.id, 'Rejected')} className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">Reject</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
