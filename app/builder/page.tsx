'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'email' | 'multiple_choice' | 'yes_no';
  options: string[]; // للاختيار من متعدد
}

export default function FormBuilder() {
  const router = useRouter();
  const [formTitle, setFormTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  // إضافة سؤال جديد للقائمة
  const addQuestion = (type: Question['question_type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      question_type: type,
      options: type === 'multiple_choice' ? ['Option 1', 'Option 2'] : [],
    };
    setQuestions([...questions, newQuestion]);
  };

  // تحديث نص السؤال
  const updateQuestionText = (id: string, text: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, question_text: text } : q))
    );
  };

  // تحديث الخيارات لأسئلة الاختيار من متعدد
  const updateOption = (qId: string, optIndex: number, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOpts = [...q.options];
          newOpts[optIndex] = text;
          return { ...q, options: newOpts };
        }
        return q;
      })
    );
  };

  // إضافة خيار جديد في الاختيار من متعدد
  const addOption = (qId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] };
        }
        return q;
      })
    );
  };

  // حذف سؤال
  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // حفظ الفورم والأسئلة في Supabase
  const handleSaveForm = async () => {
    if (!formTitle.trim()) {
      alert('Please enter a form title.');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question.');
      return;
    }

    setSaving(true);

    try {
      // 1. حفظ الفورم في جدول forms والحصول على الـ ID الناتج
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .insert([{ title: formTitle, user_id: 'user_1' }])
        .select('id')
        .single();

      if (formError || !formData) {
        throw new Error(formError?.message || 'Failed to create form');
      }

      const newFormId = formData.id;

      // 2. إعداد الأسئلة للربط بالـ form_id الصحيح
      const questionsToInsert = questions.map((q) => ({
        form_id: newFormId,
        question_text: q.question_text || 'Untitled Question',
        question_type: q.question_type,
        options: q.options || [],
      }));

      // 3. حفظ الأسئلة في جدول questions
      const { error: qError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (qError) {
        throw new Error(qError.message || 'Failed to save questions');
      }

      alert('Form created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert('Failed to save form: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          ← Back to Dashboard
        </Link>
        <button
          onClick={handleSaveForm}
          disabled={saving}
          className="bg-indigo-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Publish Form'}
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Create Interactive Form</h1>

        {/* Form Title Input */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Form Title</label>
          <input
            type="text"
            placeholder="e.g. Customer Feedback Form"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-medium"
          />
        </div>

        {/* Questions List */}
        <div className="space-y-6 mb-8">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Question {index + 1} ({q.question_type.replace('_', ' ')})
                </span>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="text-red-500 hover:text-red-700 font-medium text-sm"
                >
                  Delete Question
                </button>
              </div>

              {/* Question Text */}
              <input
                type="text"
                placeholder="Type your question here..."
                value={q.question_text}
                onChange={(e) => updateQuestionText(q.id, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              {/* Options for Multiple Choice */}
              {q.question_type === 'multiple_choice' && (
                <div className="space-y-2 ml-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Options:</p>
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <span className="text-gray-400">•</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    className="text-xs text-indigo-600 font-bold hover:underline mt-2 inline-block"
                  >
                    + Add Option
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Question Actions */}
        <div className="bg-gray-100 p-6 rounded-xl border border-dashed border-gray-300 text-center">
          <p className="text-sm font-semibold text-gray-600 mb-4">Add a new question:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => addQuestion('text')}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition"
            >
              + Text Answer
            </button>
            <button
              onClick={() => addQuestion('email')}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition"
            >
              + Email
            </button>
            <button
              onClick={() => addQuestion('multiple_choice')}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition"
            >
              + Multiple Choice
            </button>
            <button
              onClick={() => addQuestion('yes_no')}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition"
            >
              + Yes / No
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}