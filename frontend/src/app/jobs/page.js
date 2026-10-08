'use client';
import Link from "next/link";
import {
    User,
    Phone,
    AtSign,
    MapPin,
    Briefcase,
    MessageSquare,
    FileText,
    UploadCloud,
    Send,
    CheckCircle2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import api from '../utils/api.js';

const APPLYING_FOR_OPTIONS = ['District Level', 'Taluka Level', 'Village Level'];

const inputClass =
    "w-full h-11 rounded-2xl border text-black border-gray-200 bg-gray-50 pl-12 pr-4 outline-none focus:border-green-500 focus:bg-white transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed";

export default function JobsPage() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.2 });
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        applying_for: '',
        subject: '',
        description: '',
    });

    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);
    const [villages, setVillages] = useState([]);

    const [locationIds, setLocationIds] = useState({ state_id: '', district_id: '', taluka_id: '' });
    const [locationNames, setLocationNames] = useState({ state: '', district: '', taluka: '', village: '' });

    const [cvFile, setCvFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchIndiaStates = async () => {
            try {
                const countriesRes = await api.get('/countries');
                const india = countriesRes.data.find((c) => c.iso2 === 'IN' || c.name === 'India');
                if (!india) return;
                const statesRes = await api.get(`/states?country_id=${india.id}`);
                setStates(statesRes.data);
            } catch (err) {
                console.error('Failed to load states', err);
            }
        };
        fetchIndiaStates();
    }, []);

    useEffect(() => {
        if (!states.length || locationIds.state_id) return;

        const defaultState = states.find((s) => s.name?.toLowerCase() === 'maharashtra');
        if (!defaultState) return;

        setLocationIds((prev) => ({ ...prev, state_id: String(defaultState.id) }));
        setLocationNames((prev) => ({ ...prev, state: defaultState.name }));
    }, [states, locationIds.state_id]);

    useEffect(() => {
        if (!locationIds.state_id) {
            setDistricts([]);
            return;
        }
        const fetchDistricts = async () => {
            try {
                const res = await api.get(`/districts?state_id=${locationIds.state_id}`);
                setDistricts(res.data);
            } catch (err) {
                console.error('Failed to load districts', err);
                setDistricts([]);
            }
        };
        fetchDistricts();
    }, [locationIds.state_id]);

    useEffect(() => {
        if (!locationIds.district_id) {
            setTalukas([]);
            return;
        }
        const fetchTalukas = async () => {
            try {
                const res = await api.get(`/talukas?district_id=${locationIds.district_id}`);
                setTalukas(res.data);
            } catch (err) {
                console.error('Failed to load talukas', err);
                setTalukas([]);
            }
        };
        fetchTalukas();
    }, [locationIds.district_id]);

    useEffect(() => {
        if (!locationIds.taluka_id) {
            setVillages([]);
            return;
        }
        const fetchVillages = async () => {
            try {
                const res = await api.get(`/villages?taluka_id=${locationIds.taluka_id}`);
                setVillages(res.data);
            } catch (err) {
                console.error('Failed to load villages', err);
                setVillages([]);
            }
        };
        fetchVillages();
    }, [locationIds.taluka_id]);

    const handleStateSelect = (e) => {
        const stateId = e.target.value;
        const match = states.find((s) => String(s.id) === stateId);
        setLocationIds({ state_id: stateId, district_id: '', taluka_id: '' });
        setLocationNames({ state: match ? match.name : '', district: '', taluka: '', village: '' });
    };

    const handleDistrictSelect = (e) => {
        const districtId = e.target.value;
        const match = districts.find((d) => String(d.id) === districtId);
        setLocationIds((prev) => ({ ...prev, district_id: districtId, taluka_id: '' }));
        setLocationNames((prev) => ({ ...prev, district: match ? match.district_name : '', taluka: '', village: '' }));
    };

    const handleTalukaSelect = (e) => {
        const talukaId = e.target.value;
        const match = talukas.find((t) => String(t.id) === talukaId);
        setLocationIds((prev) => ({ ...prev, taluka_id: talukaId }));
        setLocationNames((prev) => ({ ...prev, taluka: match ? match.taluka_name : '', village: '' }));
    };

    const handleVillageSelect = (e) => {
        setLocationNames((prev) => ({ ...prev, village: e.target.value }));
    };

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        if (!file) {
            setCvFile(null);
            return;
        }
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!['.pdf', '.doc', '.docx'].includes(ext)) {
            setErrors((prev) => ({ ...prev, cv_file: 'Only PDF or DOC/DOCX files are allowed' }));
            setCvFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, cv_file: 'File size must be under 10MB' }));
            setCvFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setErrors((prev) => ({ ...prev, cv_file: '' }));
        setCvFile(file);
    };

    const removeFile = () => {
        setCvFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validate = () => {
        const nextErrors = {};
        if (!formData.first_name.trim()) nextErrors.first_name = 'First name is required';
        if (!formData.last_name.trim()) nextErrors.last_name = 'Last name is required';
        if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required';
        if (!formData.email.trim()) nextErrors.email = 'Email is required';
        if (!formData.applying_for) nextErrors.applying_for = 'Please select a role';
        if (!cvFile) nextErrors.cv_file = 'Please upload your CV (PDF or DOC only)';
        setErrors((prev) => ({ ...prev, ...nextErrors }));
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('first_name', formData.first_name);
            payload.append('last_name', formData.last_name);
            payload.append('phone', formData.phone);
            payload.append('email', formData.email);
            payload.append('state', locationNames.state);
            payload.append('district', locationNames.district);
            payload.append('taluka', locationNames.taluka);
            payload.append('village', locationNames.village);
            payload.append('applying_for', formData.applying_for);
            payload.append('subject', formData.subject);
            payload.append('description', formData.description);
            payload.append('cv_file', cvFile);

            await api.post('/jobs', payload);

            setSubmitted(true);
            setFormData({
                first_name: '',
                last_name: '',
                phone: '',
                email: '',
                applying_for: '',
                subject: '',
                description: '',
            });
            setLocationIds({ state_id: '', district_id: '', taluka_id: '' });
            setLocationNames({ state: '', district: '', taluka: '', village: '' });
            setCvFile(null);
            setErrors({});
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Error submitting job application:', err);
            setSubmitError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <section className="relative w-full h-56 overflow-hidden ">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/media/about-hero.jpg')" }}
                ></div>
                <div className="absolute inset-0 bg-black/45"></div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5">
                    <div className="flex items-center gap-2 text-white/80 uppercase tracking-[2px] text-[11px] font-semibold">
                        <Link href="/" className="hover:underline">
                            Home
                        </Link>
                        <span>/</span>
                        <span>Job Application</span>
                    </div>
                    <h1 className="text-white text-4xl md:text-5xl font-bold mt-3">Job Application</h1>
                </div>
            </section>

            <section ref={ref} className="relative min-h-screen bg-gradient-to-br from-[#f5fff3] via-white to-[#ecfff0] overflow-hidden py-16 px-4">

                <div className="absolute top-0 left-0 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-40"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-200 rounded-full blur-3xl opacity-40"></div>

                <div className="relative z-10 max-w-6xl mx-auto">

                    <motion.div
                        className="text-center mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Briefcase size={16} />
                            Join Star Agro
                        </motion.div>
                        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900">
                            Apply for District, Taluka, or Village Level Roles
                        </h2>
                        <div className="mt-4 max-w-7xl mx-auto overflow-hidden rounded-full border border-green-100 bg-white/70 py-2.5">
                            <div className="flex w-max gap-120 animate-marquee whitespace-nowrap">
                                {[0, 1].map((i) => (
                                    <span
                                        key={i}
                                        className="mx-4 flex items-center gap-2 text-sm md:text-base font-medium text-red-700"
                                    >
                                        Please fill out the form below to apply for one of the available positions: District Place, Taluka Place, or Village Place. Select the appropriate role and location to proceed with your application.
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white rounded-[35px] p-6 md:p-10"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {submitted ? (
                            <motion.div
                                className="flex flex-col items-center justify-center text-center py-14"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="text-green-600" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Application Submitted!</h3>
                                <p className="text-gray-600 mt-2 max-w-md">
                                    Thank you for applying. Our team will review your application and contact you soon.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSubmitted(false)}
                                    className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:scale-[1.02] transition-all shadow-lg"
                                >
                                    Submit Another Application
                                </button>
                            </motion.div>
                        ) : (
                            <form className="space-y-5" onSubmit={handleSubmit} noValidate>

                                {submitError && (
                                    <div className="rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
                                        {submitError}
                                    </div>
                                )}

                                {/* Name row */}
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div>
                                        <div className="relative">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                value={formData.first_name}
                                                onChange={handleChange('first_name')}
                                                className={inputClass}
                                            />
                                        </div>
                                        {errors.first_name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.first_name}</p>}
                                    </div>

                                    <div>
                                        <div className="relative">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                value={formData.last_name}
                                                onChange={handleChange('last_name')}
                                                className={inputClass}
                                            />
                                        </div>
                                        {errors.last_name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.last_name}</p>}
                                    </div>
                                </div>

                                {/* Phone / Email row */}
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                placeholder="Phone Number"
                                                value={formData.phone}
                                                onChange={handleChange('phone')}
                                                className={inputClass}
                                            />
                                        </div>
                                        {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>}
                                    </div>

                                    <div>
                                        <div className="relative">
                                            <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                placeholder="Email Address"
                                                value={formData.email}
                                                onChange={handleChange('email')}
                                                className={inputClass}
                                            />
                                        </div>
                                        {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
                                    </div>
                                </div>

                                {/* Location row 1 */}
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                        <select
                                            value={locationIds.state_id}
                                            onChange={handleStateSelect}
                                            className={inputClass}
                                        >
                                            <option value="">Select State</option>
                                            {states.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                        <select
                                            value={locationIds.district_id}
                                            onChange={handleDistrictSelect}
                                            disabled={!locationIds.state_id}
                                            className={inputClass}
                                        >
                                            <option value="">
                                                {locationIds.state_id && districts.length === 0 ? 'No districts available' : 'Select District'}
                                            </option>
                                            {districts.map((d) => (
                                                <option key={d.id} value={d.id}>{d.district_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Location row 2 */}
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                        <select
                                            value={locationIds.taluka_id}
                                            onChange={handleTalukaSelect}
                                            disabled={!locationIds.district_id}
                                            className={inputClass}
                                        >
                                            <option value="">
                                                {locationIds.district_id && talukas.length === 0 ? 'No talukas available' : 'Select Taluka'}
                                            </option>
                                            {talukas.map((t) => (
                                                <option key={t.id} value={t.id}>{t.taluka_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                        <select
                                            value={locationNames.village}
                                            onChange={handleVillageSelect}
                                            disabled={!locationIds.taluka_id}
                                            className={inputClass}
                                        >
                                            <option value="">
                                                {locationIds.taluka_id && villages.length === 0 ? 'No villages available' : 'Select Village'}
                                            </option>
                                            {villages.map((v) => (
                                                <option key={v.id} value={v.village_name}>{v.village_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Applying For */}
                                <div>
                                    <div className="relative">
                                        <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                        <select
                                            value={formData.applying_for}
                                            onChange={handleChange('applying_for')}
                                            className={inputClass}
                                        >
                                            <option value="">Applying For</option>
                                            {APPLYING_FOR_OPTIONS.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.applying_for && <p className="text-xs text-red-500 mt-1 ml-1">{errors.applying_for}</p>}
                                </div>

                                {/* Subject */}
                                <div className="relative">
                                    <MessageSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Subject"
                                        value={formData.subject}
                                        onChange={handleChange('subject')}
                                        className={inputClass}
                                    />
                                </div>

                                {/* Description */}
                                <div className="relative">
                                    <FileText size={18} className="absolute left-4 top-5 text-gray-400" />
                                    <textarea
                                        rows="5"
                                        placeholder="Tell us about yourself and why you'd be a great fit..."
                                        value={formData.description}
                                        onChange={handleChange('description')}
                                        className="w-full rounded-2xl border text-black border-gray-200 bg-gray-50 pt-4 pl-12 pr-4 outline-none focus:border-green-500 focus:bg-white transition-all resize-none"
                                    ></textarea>
                                </div>

                                {/* Upload CV */}
                                <div>
                                    <label
                                        htmlFor="cv_file"
                                        className={`flex items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-3 cursor-pointer transition-all ${cvFile ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50/50'
                                            }`}
                                    >
                                        <div className="w-11 h-11 rounded-2xl bg-white shadow flex items-center justify-center flex-shrink-0">
                                            <UploadCloud className="text-green-600" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {cvFile ? (
                                                <p className="text-sm font-medium text-gray-900 truncate">{cvFile.name}</p>
                                            ) : (
                                                <p className="text-sm font-medium text-gray-900">Upload CV</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-0.5">PDF or DOC/DOCX only, max 10MB</p>
                                        </div>
                                        {cvFile && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); removeFile(); }}
                                                className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-gray-400 hover:text-red-500 flex-shrink-0"
                                                aria-label="Remove file"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            id="cv_file"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                    {errors.cv_file && <p className="text-xs text-red-500 mt-1 ml-1">{errors.cv_file}</p>}
                                </div>

                                {/* Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={submitting}
                                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Application'}
                                    {!submitting && <Send size={18} />}
                                </motion.button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </section>
        </>
    );
}
