'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';

export default function MyServices() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentStatus, setDocumentStatus] = useState(null);

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);
  }, []);

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await api.get('/user/me');
        const user = response.data?.user || {};
        setDocumentStatus(user.document_status || 'Pending');
      } catch (error) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          setDocumentStatus(storedUser.document_status || 'Pending');
        } catch (storageError) {
          console.error('Error loading user status:', error);
        }
      }
    };
    fetchUserStatus();
  }, []);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services/my-services');
      setServices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const t = translations[language];
  const sp = t?.userPanel?.servicesProvider;

  const isDocumentVerified = String(documentStatus).toLowerCase() === 'verified';

  const requireVerifiedDocument = () => {
    if (isDocumentVerified) return true;
    Swal.fire({
      icon: 'warning',
      title: t?.profileIncompleteTitle || 'Complete Your Profile',
      text: sp?.documentNotVerifiedText || 'Your document is not verified yet. Please upload/verify your document on your profile before adding a service.',
      confirmButtonText: sp?.goToProfile || 'Go to Profile',
      showCancelButton: true,
      cancelButtonText: t?.swal?.cancelButton || 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        router.push('/user/profile');
      }
    });
    return false;
  };

  const SERVICE_TYPE_LABELS = {
    machine: sp?.machineProvider || 'Machine[Tractor/harvester] Provider',
    Transport: sp?.transportProvider || 'Transport Provider',
    Labour: sp?.labourProvider || 'Labour Provider',
    Guidance: sp?.guidanceProvider || 'Crop Guidance/Advice',
  };

  const getServiceTypeLabel = (value) => SERVICE_TYPE_LABELS[value] || value;
  const getPriceUnitLabel = (value) => sp?.priceUnits?.[value] || value;

  const goToAddService = () => {
    if (!requireVerifiedDocument()) return;
    router.push('/user/add-services');
  };

  const handleEdit = (service) => {
    router.push(`/user/add-services?id=${service.id}`);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t?.swal?.deleteConfirmTitle || 'Are you sure?',
      text: t?.swal?.deleteConfirmText || 'This service will be permanently deleted.',
      showCancelButton: true,
      confirmButtonText: t?.swal?.deleteConfirmButton || 'Yes, delete it',
      cancelButtonText: t?.swal?.cancelButton || 'Cancel',
      confirmButtonColor: '#d33',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((service) => service.id !== id));
      Swal.fire({ icon: 'success', title: t?.swal?.deletedTitle || 'Deleted', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t?.swal?.deleteFailedTitle || 'Delete Failed',
        text: err?.response?.data?.message || 'Error deleting service',
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
    }
  };

  const statusBadgeClass = (status) =>
    String(status).toLowerCase() === 'approved'
      ? 'bg-emerald-100 text-emerald-700'
      : String(status).toLowerCase() === 'rejected'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700';

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6 lg:p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{sp?.myServicesTitle || 'My Services'}</h2>
            <p className="text-sm text-slate-500">{sp?.myServicesSubtitle || 'Manage the transport, labour and crop-guidance services you offer.'}</p>
          </div>
          <button
            onClick={goToAddService}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold hover:shadow-lg transition text-sm sm:text-base"
          >
            <Plus size={18} />
            <span>{sp?.addService || 'Add Service'}</span>
          </button>
        </div>

        {documentStatus !== null && !isDocumentVerified && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 sm:px-6 py-3 sm:py-4 text-amber-800">
            <ShieldAlert size={20} className="shrink-0" />
            <p className="text-sm flex-1">
              {sp?.documentNotVerifiedText || 'Your document is not verified yet. Please upload your document [RC Book/Degree/Certificate] on your profile before adding a service.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/user/profile')}
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-amber-700 transition"
            >
              {sp?.goToProfile || 'Go to Profile'}
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">{t?.loading || 'Loading...'}</div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-4">{sp?.noServicesYet || 'No services added yet'}</p>
              <button
                onClick={goToAddService}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
              >
                <Plus size={20} />
                {sp?.addService || 'Add Service'}
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.name || 'Name'}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.type || 'Type'}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.price || 'Price'}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.contact || 'Contact'}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.area || 'Area'}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.status || 'Status'}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.action || 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={service.id} className={`border-b border-slate-200 hover:bg-slate-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{service.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getServiceTypeLabel(service.service_type)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.price ? `₹${service.price} ${getPriceUnitLabel(service.price_unit || '')}` : '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.contact_number || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.coverage_area || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(service.status)}`}>
                        {service.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEdit(service)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition" title={sp?.edit || 'Edit'}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(service.id)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition" title={sp?.delete || 'Delete'}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-1 sm:col-span-2 text-center py-8 text-slate-500">{t?.loading || 'Loading...'}</div>
          ) : services.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 text-center py-8">
              <p className="text-slate-500 mb-4">{sp?.noServicesYet || 'No services added yet'}</p>
              <button
                onClick={goToAddService}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold hover:bg-emerald-700 transition text-sm sm:text-base"
              >
                <Plus size={18} />
                {sp?.addService || 'Add Service'}
              </button>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{service.name}</h3>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(service.status)}`}>
                    {service.status || 'Pending'}
                  </span>
                </div>
                <p className="text-emerald-600 font-medium text-sm mb-2">{getServiceTypeLabel(service.service_type)}</p>
                <div className="space-y-1 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex justify-between"><span className="text-slate-500">{sp?.price || 'Price'}:</span><span>{service.price ? `₹${service.price} ${getPriceUnitLabel(service.price_unit || '')}` : '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{sp?.contact || 'Contact'}:</span><span>{service.contact_number || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{sp?.area || 'Area'}:</span><span>{service.coverage_area || '-'}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleEdit(service)} className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition py-2 text-xs font-medium">
                    <Edit2 size={14} /> {sp?.edit || 'Edit'}
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="flex items-center justify-center gap-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition py-2 text-xs font-medium">
                    <Trash2 size={14} /> {sp?.delete || 'Delete'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
