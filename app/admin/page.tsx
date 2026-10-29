'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalForms: 0,
    totalSubmissions: 0,
    totalUsers: 0,
  });
  const [forms, setForms] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    
    // 1. جلب الفورمز
    const { data: formsData, count: formsCount } = await supabase
      .from('forms')
      .select('*', { count: 'exact' });

    // 2. جلب عدد الردود
    const { count: subsCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    // 3. جلب المستخدمين من جدول profiles
    let { data: usersData, count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // لو الجدول فاضي لسه، هنحط مستخدم افتراضي للتوضيح في التاسك
    if (!usersData || usersData.length === 0) {
      usersData = [
        {
          id: '1',
          email: 'basant.intern@tynoc.com',
          is_active: true,
          created_at: new Date().toISOString(),
        }
      ];
      usersCount = 1;
    }

    if (formsData) setForms(formsData);
    setUsers(usersData);

    setStats({
      totalForms: formsCount || 0,
      totalSubmissions: subsCount || 0,
      totalUsers: usersCount || 1,
    });
    setLoading(false);
  }

  // دالة لتغيير حالة المستخدم (تنشيط / تعليق)
  async function handleToggleUserStatus(userId: string, currentStatus: boolean) {
    if (userId === '1') {
      // مجرد تحديث للحالة محلياً لو كان مستخدم تجريبي افتراضي
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } else {
      alert('Error updating user status.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2 inline-block bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
            >
              ← Back to User Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
              🛡️ Admin Control Panel
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Platform-wide statistics, user management, and form oversight.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Users</p>
            <h3 className="text-3xl font-extrabold text-blue-600">{stats.totalUsers}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Platform Forms</p>
            <h3 className="text-3xl font-extrabold text-indigo-600">{stats.totalForms}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Submissions</p>
            <h3 className="text-3xl font-extrabold text-emerald-600">{stats.totalSubmissions}</h3>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">User Accounts Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Joined At</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3 font-bold text-slate-800">{user.email}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {user.is_active !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.is_active ?? true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${user.is_active !== false ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      >
                        {user.is_active !== false ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forms Management Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">All Platform Forms</h2>
          {forms.length === 0 ? (
            <p className="text-slate-500 text-sm">No forms found on the platform.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Form Title</th>
                    <th className="px-6 py-3">Created At</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {forms.map((form, idx) => (
                    <tr key={form.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{form.title}</td>
                      <td className="px-6 py-3 text-slate-500 text-xs">
                        {form.created_at ? new Date(form.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-3 flex gap-2">
                        <Link
                          href={`/responses/${form.id}?from=admin`}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          View Responses
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}