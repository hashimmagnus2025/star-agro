"use client";
import { useState, useEffect } from 'react';
import api from '../utils/api.js'

const formatJoinedDate = (value) => {
  if (!value) return 'Recently joined';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently joined';

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function AdminPage() {
  const [users, setUsers] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentUsersLoading, setRecentUsersLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/user');
        const payload = response?.data;
        const userList = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        const sortedUsers = [...userList]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 4);

        setUsers(userList.length);
        setRecentUsers(sortedUsers.map((user) => ({
          id: user.id,
          name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown user',
          role: user.role || 'User',
          region: user.state || user.district || 'Not provided',
          joined: formatJoinedDate(user.created_at),
        })));
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers(0);
        setRecentUsers([]);
      } finally {
        setUsersLoading(false);
        setRecentUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const response = await api.get('/wallet/summary');
        const balance = response?.data?.balance ?? 0;
        setWalletBalance(balance);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWalletBalance();
  }, []);

  return (
    <div className="space-y-6 p-4">
      <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Overview</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Platform insights</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              This admin dashboard helps you monitor farmers, buyers, and orders in real time.
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Live analytics active
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="mt-4 text-3xl font-black text-slate-900">
            {usersLoading ? '...' : users}
          </p>
          <p className="mt-3 text-sm text-slate-500">Registered users on the platform</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Orders</p>
          <p className="mt-4 text-3xl font-black text-slate-900">326</p>
          <p className="mt-3 text-sm text-slate-500">Growth +3.2%</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Marketplace Revenue</p>
          <p className="mt-4 text-3xl font-black text-slate-900">₹92.4K</p>
          <p className="mt-3 text-sm text-slate-500">Growth +12%</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Support Tickets</p>
          <p className="mt-4 text-3xl font-black text-slate-900">18</p>
          <p className="mt-3 text-sm text-slate-500">Growth -5.5%</p>
        </div>
      </section>

     

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Latest signups</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">Recent users</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          {recentUsersLoading ? (
            <p className="text-sm text-slate-500">Loading recent users...</p>
          ) : recentUsers.length === 0 ? (
            <p className="text-sm text-slate-500">No recent users found.</p>
          ) : (
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 pr-6">Name</th>
                  <th className="py-3 pr-6">Role</th>
                  <th className="py-3 pr-6">Region</th>
                  <th className="py-3 pr-6">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentUsers.map((user) => (
                  <tr key={user.id || user.name} className="hover:bg-slate-50">
                    <td className="py-4 pr-6 font-semibold text-slate-900">{user.name}</td>
                    <td className="py-4 pr-6 text-slate-600">{user.role}</td>
                    <td className="py-4 pr-6 text-slate-600">{user.state}</td>
                    <td className="py-4 pr-6 text-slate-500">{user.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
