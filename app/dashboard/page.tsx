'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Form {
  id: string;
  title: string;
  created_at: string;
}

export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // جلب البيانات من Supabase عند فتح الصفحة
  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    // 1. جلب قائمة الفورمز
    const { data: formsData, error: formsError } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (!formsError && formsData) {
      setForms(formsData);
    }

    // 2. جلب إجمالي عدد الردود
    const { count, error: subError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    if (!subError && count !== null) {
      setTotalSubmissions(count);
    }

    setLoading(false);
  }

  // دالة لتكرار الفورم (Duplicate Form)
  async function handleDuplicateForm(formId: string) {
    // 1. جلب بيانات الفورم الأصلي
    const { data: originalForm, error: formError } = await supabase
      .from('forms')
      .select('title')
      .eq('id', formId)
      .single();

    if (formError || !originalForm) {
      alert('Error fetching form to duplicate.');
      return;
    }

    // 2. إنشاء فورم جديد بنسخ العنوان وإضافة كلمة (Copy)
    const { data: newForm, error: insertError } = await supabase
      .from('forms')
      .insert([{ title: `${originalForm.title} (Copy)` }])
      .select()
      .single();

    if (insertError || !newForm) {
      alert('Error duplicating form.');
      return;
    }

    // 3. جلب أسئلة الفورم الأصلي ونسخها للفرم الجديد
    const { data: originalQuestions } = await supabase
      .from('questions')
      .select('question_text, question_type, options')
      .eq('form_id', formId);

    if (originalQuestions && originalQuestions.length > 0) {
      const newQuestionsPayload = originalQuestions.map(q => ({
        form_id: newForm.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
      }));

      await supabase.from('questions').insert(newQuestionsPayload);
    }

    alert('Form duplicated successfully!');
    fetchDashboardData(); // تحديث القائمة فوراً
  }

  // دالة لحذف فورم
  async function handleDeleteForm(id: string) {
    if (!confirm('Are you sure you want to delete this form?')) return;

    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (!error) {
      setForms(forms.filter((form) => form.id !== id));
    } else {
      alert('Error deleting form');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          FormChat
        </Link>
        
        {/* أزرار الإجراءات العلوية */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
          >
            🛡️ Admin Panel
          </Link>
          <Link
            href="/builder"
            className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm cursor-pointer"
          >
            + Create New Form
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">User Dashboard</h1>

        {/* Stats Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Forms</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{forms.length}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">
              📝
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Responses</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalSubmissions}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold text-xl">
              💬
            </div>
          </div>
        </div>

        {/* Forms Table / List Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">Your Forms</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading your forms...</div>
          ) : forms.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">You haven't created any forms yet.</p>
              <Link
                href="/builder"
                className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Create Your First Form
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {forms.map((form) => (
                <div key={form.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Created on: {new Date(form.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    {/* View Responses */}
                    <Link
                      href={`/responses/${form.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 bg-indigo-50 rounded-md"
                    >
                      View Responses
                    </Link>

                    {/* Chatbot Public Link */}
                    <Link
                      href={`/chat/${form.id}`}
                      className="text-xs text-green-600 hover:text-green-800 font-medium px-3 py-1.5 bg-green-50 rounded-md"
                    >
                      Preview Chat
                    </Link>

                    {/* Duplicate Form Button */}
                    <button
                      onClick={() => handleDuplicateForm(form.id)}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 bg-purple-50 rounded-md cursor-pointer"
                    >
                      📋 Duplicate
                    </button>

                    {/* Embed Code Button */}
                    <button
                      onClick={() => {
                        const embedCode = `<div id="formchat-widget" style="position: fixed; bottom: 20px; right: 20px; width: 350px; height: 500px; z-index: 9999;">\n  <iframe src="${window.location.origin}/embed/${form.id}" style="width: 100%; height: 100%; border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></iframe>\n</div>`;
                        navigator.clipboard.writeText(embedCode);
                        alert('Embed code copied to clipboard! You can paste it into any website.');
                      }}
                      className="text-xs text-amber-600 hover:text-amber-800 font-medium px-3 py-1.5 bg-amber-50 rounded-md cursor-pointer"
                    >
                      Embed Code
                    </button>

                    {/* Delete Form */}
                    <button
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 bg-red-50 rounded-md cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}