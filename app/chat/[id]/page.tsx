'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'email' | 'multiple_choice' | 'yes_no' | 'dropdown' | 'rating' | 'date' | 'file';
  options: string[];
}

function ChatContent() {
  const params = useParams();
  const formId = params?.id as string;

  const [formTitle, setFormTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // جلب البيانات واستعادة المسودة المحفوظة إن وجدت
  useEffect(() => {
    if (formId) {
      setSubmitted(false);
      setCurrentIndex(0);
      setAnswers({});
      setCurrentInput('');
      fetchFormAndQuestions();
    }
  }, [formId]);

  // ميزة الحفظ التلقائي (Autosave) عند تغير الإجابات
  useEffect(() => {
    if (formId && Object.keys(answers).length > 0 && !submitted) {
      localStorage.setItem(`form_draft_${formId}`, JSON.stringify(answers));
    }
  }, [answers, formId, submitted]);

  async function fetchFormAndQuestions() {
    setLoading(true);
    const { data: formData } = await supabase
      .from('forms')
      .select('title')
      .eq('id', formId)
      .single();

    if (formData) setFormTitle(formData.title);

    const { data: qData } = await supabase
      .from('questions')
      .select('*')
      .eq('form_id', formId);

    if (qData) {
      setQuestions(qData);
      
      // التحقق من وجود مسودة سابقة (Draft Recovery)
      const savedDraft = localStorage.getItem(`form_draft_${formId}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          if (confirm('Found a previously saved draft. Would you like to restore your progress?')) {
            setAnswers(parsedDraft);
            // تحديد المؤشر عند السؤال الأخير الذي تم الوصول إليه
            const answeredKeys = Object.keys(parsedDraft);
            if (answeredKeys.length > 0 && answeredKeys.length < qData.length) {
              setCurrentIndex(answeredKeys.length);
            }
          } else {
            localStorage.removeItem(`form_draft_${formId}`);
          }
        } catch (e) {
          console.error('Error loading draft', e);
        }
      }
    }
    setLoading(false);
  }

  const handleNext = async (answerValue: string) => {
    if (!answerValue || !answerValue.trim()) {
      alert('Please provide an answer.');
      return;
    }

    const currentQ = questions[currentIndex];
    const updatedAnswers = { ...answers, [currentQ.id]: answerValue };
    setAnswers(updatedAnswers);
    setCurrentInput('');

    // المنطق الشرطي (Conditional Logic): مثال لو الإجابة "No" في سؤال معين يمكن توجيهه أو الانتقال للسؤال التالي بشكل طبيعي
    let nextIndex = currentIndex + 1;
    
    // مثال شرطي بسيط: إذا كان السؤال يحتوي على شرط معين (يمكن تخصيصه لاحقاً)
    if (currentQ.question_text.toLowerCase().includes('other') && answerValue === 'No') {
      // مثال: تخطي السؤال التالي لو الإجابة لا
      // nextIndex += 1; 
    }

    // الانتقال للسؤال التالي أو الإنهاء
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
    } else {
      await submitResponses(updatedAnswers);
    }
  };

  async function submitResponses(finalAnswers: Record<string, string>) {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: formId,
          answers: finalAnswers,
        }),
      });

      const textResponse = await response.text();
      let result;
      try {
        result = textResponse ? JSON.parse(textResponse) : {};
      } catch (e) {
        throw new Error(`Server error or invalid response: ${textResponse || 'Empty response'}`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Error submitting answers.');
      }

      // مسح المسودة بعد نجاح الإرسال
      localStorage.removeItem(`form_draft_${formId}`);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.message || 'Error submitting answers.');
    } finally {
      setLoading(false);
    }
  }

  const handleRestart = () => {
    localStorage.removeItem(`form_draft_${formId}`);
    setSubmitted(false);
    setCurrentIndex(0);
    setAnswers({});
    setCurrentInput('');
  };

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium">
        Loading chat interface...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md w-full animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
            ✓
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Thank you!</h2>
          <p className="text-slate-600 mb-6 text-sm">Your response has been successfully recorded.</p>

          <div className="space-y-3">
            <button
              onClick={handleRestart}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition text-sm cursor-pointer"
            >
              Fill Out Again
            </button>
            <Link
              href="/dashboard"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition text-sm shadow-md text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg"
        >
          ← Dashboard
        </Link>
        <div className="text-center">
          <h1 className="text-base font-bold text-slate-800">{formTitle}</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="w-20"></div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5">
        <div
          className="bg-indigo-600 h-1.5 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Chat Container */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 md:p-6 flex flex-col justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 flex flex-col justify-between min-h-[400px]">
          {/* Question Display Area */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
                AI
              </div>
              <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm font-medium leading-relaxed border border-slate-200/60 shadow-sm">
                {currentQ?.question_text}
              </div>
            </div>
          </div>

          {/* Interactive Answer Area */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            {currentQ?.question_type === 'yes_no' ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNext('Yes')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow transition text-sm cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleNext('No')}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-xl font-semibold transition text-sm cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : currentQ?.question_type === 'multiple_choice' ? (
              <div className="space-y-2">
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleNext(opt)}
                    className="w-full text-left px-4 py-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition font-medium text-slate-700 bg-slate-50/50 hover:text-indigo-600 text-sm cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : currentQ?.question_type === 'dropdown' ? (
              <div className="space-y-3">
                <select
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm text-slate-800"
                >
                  <option value="">Select an option...</option>
                  {currentQ.options.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleNext(currentInput)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition text-sm shadow cursor-pointer"
                >
                  Confirm Selection
                </button>
              </div>
            ) : currentQ?.question_type === 'rating' ? (
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleNext(star.toString())}
                    className="w-12 h-12 bg-slate-50 border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-slate-700 rounded-xl font-bold transition shadow-sm text-base flex items-center justify-center cursor-pointer"
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            ) : currentQ?.question_type === 'date' ? (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm text-slate-800"
                />
                <button
                  onClick={() => handleNext(currentInput)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition text-sm shadow cursor-pointer"
                >
                  Submit Date
                </button>
              </div>
            ) : currentQ?.question_type === 'file' ? (
              <div className="space-y-3">
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCurrentInput(e.target.files[0].name);
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
                <button
                  onClick={() => handleNext(currentInput || 'Uploaded File')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition text-sm shadow cursor-pointer"
                >
                  Upload & Continue
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type={currentQ?.question_type === 'email' ? 'email' : 'text'}
                  placeholder="Type your answer here..."
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext(currentInput)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white text-sm"
                />
                <button
                  onClick={() => handleNext(currentInput)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition text-sm shadow cursor-pointer"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-3">
        Powered by FormChat AI
      </footer>
    </div>
  );
}

export default function ChatForm() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}