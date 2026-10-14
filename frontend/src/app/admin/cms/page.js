'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';
import RichTextEditor from '../components/RichTextEditor.js';

const PAGE_OPTIONS = [
  { value: 'Home', label: 'Home' },
  { value: 'About Us', label: 'About Us' },
  { value: 'Services', label: 'Services' },
  { value: 'Crops', label: 'Crops' },
  { value: 'Gallery', label: 'Gallery' },
  { value: 'Contact Us', label: 'Contact Us' },
  { value: 'Terms & Conditions', label: 'Terms & Conditions' },
  { value: 'Privacy Policy', label: 'Privacy Policy' },
];

const LEGAL_PAGES = ['Terms & Conditions', 'Privacy Policy'];

const TYPE_OPTIONS = [
  { value: 'banner', label: 'Banner / Hero' },
  { value: 'text', label: 'Text Section' },
  { value: 'image', label: 'Image Section' },
  { value: 'content', label: 'Content Block' },
];

export default function CmsAdminPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterPage, setFilterPage] = useState('Home');
  const [searchTerm, setSearchTerm] = useState('');
  const [ImagePreview, setImagePreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    page: 'Home',
    language: 'en',
    section: '',
    type: 'banner',
    title: '',
    subtitle: '',
    content: '',
    image_url: '',
    imageFile: null,
    button_text: '',
    button_link: '',
    order_index: 0,
    text_1: '',
    text_2: '',
    text_3: '',
    text_4: '',
    text_5: '',
    text_6: '',
  });

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const matchesPage = entry.page === filterPage;
        const term = searchTerm.toLowerCase();
        const haystack = [entry.page, entry.section, entry.language, entry.type, entry.title, entry.subtitle, entry.content, entry.text_1, entry.text_2, entry.text_3, entry.text_4, entry.text_5, entry.text_6]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return matchesPage && haystack.includes(term);
      }),
    [entries, filterPage, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage));
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cms');
      setEntries(response.data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || 'Unable to load CMS entries');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      page: filterPage,
      language: 'en',
      section: LEGAL_PAGES.includes(filterPage) ? 'Body' : '',
      type: LEGAL_PAGES.includes(filterPage) ? 'content' : 'banner',
      title: '',
      subtitle: '',
      content: '',
      image_url: '',
      imageFile: null,
      button_text: '',
      button_link: '',
      order_index: 0,
      text_1: '',
      text_2: '',
      text_3: '',
      text_4: '',
      text_5: '',
      text_6: '',
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setEditingId(entry.id);
    setFormData({
      page: entry.page,
      language: entry.language || 'en',
      section: entry.section,
      type: entry.type,
      title: entry.title || '',
      subtitle: entry.subtitle || '',
      content: entry.content || '',
      image_url: entry.image_url || '',
      imageFile: null,
      button_text: entry.button_text || '',
      button_link: entry.button_link || '',
      order_index: entry.order_index || 0,
      text_1: entry.text_1 || '',
      text_2: entry.text_2 || '',
      text_3: entry.text_3 || '',
      text_4: entry.text_4 || '',
      text_5: entry.text_5 || '',
      text_6: entry.text_6 || '',
    });
    setImagePreview(entry.image_url || null);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      page: filterPage,
      section: '',
      type: 'banner',
      title: '',
      subtitle: '',
      content: '',
      image_url: '',
      imageFile: null,
      button_text: '',
      button_link: '',
      order_index: 0,
      text_1: '',
      text_2: '',
      text_3: '',
      text_4: '',
      text_5: '',
      text_6: '',
    });
    setError('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, imageFile: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.page || !formData.section || !formData.type) {
      setError('Page, section and type are required.');
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('page', formData.page);
      formPayload.append('language', formData.language);
      formPayload.append('section', formData.section);
      formPayload.append('type', formData.type);
      formPayload.append('title', formData.title || '');
      formPayload.append('subtitle', formData.subtitle || '');
      formPayload.append('content', formData.content || '');
      formPayload.append('button_text', formData.button_text || '');
      formPayload.append('button_link', formData.button_link || '');
      formPayload.append('order_index', String(Number(formData.order_index) || 0));
      formPayload.append('text_1', formData.text_1 || '');
      formPayload.append('text_2', formData.text_2 || '');
      formPayload.append('text_3', formData.text_3 || '');
      formPayload.append('text_4', formData.text_4 || '');
      formPayload.append('text_5', formData.text_5 || '');
      formPayload.append('text_6', formData.text_6 || '');

      if (formData.imageFile) {
        formPayload.append('image', formData.imageFile);
      }

      if (!formData.imageFile && formData.image_url) {
        formPayload.append('image_url', formData.image_url);
      }

      const response = editingId
        ? await api.put(`/cms/${editingId}`, formPayload)
        : await api.post('/cms', formPayload);

      const savedContent = response.data.content || {
        id: editingId || response.data.id,
        page: formData.page,
        section: formData.section,
        type: formData.type,
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        content: formData.content || null,
        image_url: response.data.content?.image_url || formData.image_url || null,
        button_text: formData.button_text || null,
        button_link: formData.button_link || null,
        order_index: Number(formData.order_index) || 0,
        text_1: formData.text_1 || null,
        text_2: formData.text_2 || null,
        text_3: formData.text_3 || null,
        text_4: formData.text_4 || null,
        text_5: formData.text_5 || null,
        text_6: formData.text_6 || null,
      };

      if (editingId) {
        setSuccess('Content updated successfully.');
        toast.success('Content updated successfully.');
        setEntries((prev) => prev.map((item) => (item.id === editingId ? savedContent : item)));
      } else {
        setSuccess('Content added successfully.');
        toast.success('Content added successfully.');
        setEntries((prev) => [...prev, savedContent]);
      }

      setShowModal(false);
      setFormData((prev) => ({ ...prev, imageFile: null }));
      setImagePreview(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to save content';
      setError(message);
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this CMS entry?')) return;
    try {
      await api.delete(`/cms/${id}`);
      setEntries((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Content deleted successfully.');
      toast.success('Content deleted successfully.');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to delete content';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Content Management</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">CMS for website pages</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Manage banners, text, image blocks and page content for Home, About, Services, Crops, Gallery, Contact Us, Terms & Conditions, and Privacy Policy.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition"
        >
          <Plus size={18} />
          Add content
        </button>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Filter by page</p>
            <select
              value={filterPage}
              onChange={(e) => { setFilterPage(e.target.value); setCurrentPage(1); }}
              className="mt-2 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              {PAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search CMS content..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">Total entries: {filteredEntries.length}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">{success}</div>
      )}

      <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full table-auto text-left text-sm text-slate-700">
            <thead className="hidden sm:table-header-group border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr className="table-row">
                <th className="py-3 px-4">Page</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr className="block sm:table-row">
                  <td colSpan="6" className="block sm:table-cell py-8 text-center text-slate-500">Loading content...</td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr className="block sm:table-row">
                  <td colSpan="6" className="block sm:table-cell py-8 text-center text-slate-500">No content found for this page.</td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="block sm:table-row hover:bg-slate-50 sm:border-b sm:border-slate-200">
                    <td className="block sm:table-cell py-4 px-4 sm:align-top">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Page</span>
                      <span className="font-semibold text-slate-900 break-words">{entry.page}</span>
                    </td>
                    <td className="block sm:table-cell py-4 px-4 sm:align-top">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Section</span>
                      <span className="text-slate-600 break-words">{entry.section}</span>
                    </td>
                    <td className="block sm:table-cell py-4 px-4 sm:align-top">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Language</span>
                      <span className="text-slate-600 break-words">{entry.language || 'en'}</span>
                    </td>
                    <td className="block sm:table-cell py-4 px-4 sm:align-top">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Type</span>
                      <span className="text-slate-600 break-words">{entry.type}</span>
                    </td>
                    <td className="block sm:table-cell py-4 px-4 sm:align-top">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Title</span>
                      <span className="text-slate-600 break-words">{entry.title || '-'}</span>
                    </td>
                    <td className="block sm:table-cell py-4 px-4 sm:align-top">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Actions</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(entry)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEntries.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-full sm:max-w-3xl max-h-[calc(100vh-4rem)] rounded-3xl bg-white shadow-2xl overflow-y-auto mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-t-3xl border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-4 sm:px-6 sm:py-5 text-white">
              <div>
                <h2 className="text-2xl font-bold">{editingId ? 'Edit CMS Entry' : 'Add CMS Entry'}</h2>
                <p className="text-sm text-emerald-100">Update page content, banners, text or images.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-full bg-white/15 p-2 hover:bg-white/25 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-6 p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Page
                  <select
                    name="page"
                    value={formData.page}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {PAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Language
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Type
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Section name
                  <input
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    placeholder="Hero, Feature, FAQ, Banner"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Display order
                  <input
                    name="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Title
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Main heading"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Subtitle
                  <input
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="Secondary heading"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Content or description
                {LEGAL_PAGES.includes(formData.page) ? (
                  <RichTextEditor
                    value={formData.content}
                    onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                    placeholder="Write the full Terms & Conditions / Privacy Policy content here"
                  />
                ) : (
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Text, paragraph, caption or HTML content"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  />
                )}
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Custom Text 1
                  <textarea
                    name="text_1"
                    value={formData.text_1}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Extra text field 1"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Custom Text 2
                  <textarea
                    name="text_2"
                    value={formData.text_2}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Extra text field 2"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Custom Text 3
                  <textarea
                    name="text_3"
                    value={formData.text_3}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Extra text field 3"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Custom Text 4
                  <textarea
                    name="text_4"
                    value={formData.text_4}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Extra text field 4"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Custom Text 5
                  <textarea
                    name="text_5"
                    value={formData.text_5}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Extra text field 5"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Custom Text 6
                  <textarea
                    name="text_6"
                    value={formData.text_6}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Extra text field 6"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Upload Image
                <input
                  type="file"
                  name="image"
                  onChange={handleFileChange}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                {formData.image_url && !formData.imageFile && (
                  <p className="text-xs text-slate-500">Current image: {formData.image_url}</p>
                )}
                <div className="h-34 w-34 shrink-0 overflow-hidden rounded-full border-2 border-emerald-200 bg-slate-100">
                  {ImagePreview ? (
                    <img
                      src={ImagePreview}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-slate-400">
                      No image selected
                    </div>
                  )}
                </div>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Button text
                  <input
                    name="button_text"
                    value={formData.button_text}
                    onChange={handleInputChange}
                    placeholder="Learn more"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Button link
                  <input
                    name="button_link"
                    value={formData.button_link}
                    onChange={handleInputChange}
                    placeholder="/services or https://..."
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-3xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition"
                >
                  {editingId ? 'Update content' : 'Save content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
