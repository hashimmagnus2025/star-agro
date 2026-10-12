'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, User, Users } from 'lucide-react';
import api from '../../utils/api.js';
import ProductForm from '../add-product/ProductForm.js';

const VILLAGE_MANAGED_ROLES = ['user', 'farmer', 'Enterprenure/Treder'];
const isVillageManagedRole = (role) =>
  VILLAGE_MANAGED_ROLES.some((allowedRole) => allowedRole.toLowerCase() === String(role || 'user').trim().toLowerCase());

const displayName = (person) =>
  person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim() || `User #${person.id}`;

function AddUserProductsFlow() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [villageUsers, setVillageUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    const fetchVillageTeam = async () => {
      try {
        const response = await api.get('/jurisdictions/my-team');
        if (response.data?.scope_type !== 'village') {
          setError('Only Village Representatives can create products for village members.');
          return;
        }
        const users = Array.isArray(response.data.users) ? response.data.users : [];
        setVillageUsers(users.filter((villageUser) => isVillageManagedRole(villageUser.role)));
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load your village team.');
      } finally {
        setLoading(false);
      }
    };

    fetchVillageTeam();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-700">{error}</p>
          <Link
            href="/user/my-team"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800"
          >
            <ArrowLeft size={16} /> Back to My Team
          </Link>
        </div>
      </div>
    );
  }

  // Step 2: user picked — show the product form locked to them.
  if (selectedUser) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-2">
        <ProductForm
          ownerUserId={selectedUser.id}
          ownerLabel={displayName(selectedUser)}
          onChangeOwner={() => setSelectedUser(null)}
          onOwnerCreated={() => {
            setJustCreated(true);
            setSelectedUser(null);
          }}
        />
      </div>
    );
  }

  // Step 1: pick which village member this listing is for.
  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-2">
      <Link
        href="/user/my-team"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
      >
        <ArrowLeft size={16} /> Back to My Team
      </Link>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-5 text-white sm:px-8">
          <Users size={24} />
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Add a product for a village member</h1>
            <p className="mt-1 text-sm text-emerald-50">Choose who this listing belongs to, then fill in the product details.</p>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {justCreated && (
            <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Listing submitted. You can add another one for a village member below.
            </p>
          )}

          {villageUsers.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No users, farmers, or traders found in your village yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {villageUsers.map((villageUser) => (
                <button
                  key={villageUser.id}
                  type="button"
                  onClick={() => setSelectedUser(villageUser)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <User size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">{displayName(villageUser)}</span>
                    <span className="block truncate text-xs capitalize text-slate-500">
                      {villageUser.role || 'user'}
                      {villageUser.phone ? ` — ${villageUser.phone}` : ''}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AddUserProducts() {
  return (
    <Suspense fallback={(
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    )}>
      <AddUserProductsFlow />
    </Suspense>
  );
}
