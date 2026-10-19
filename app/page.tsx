import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col justify-between" suppressHydrationWarning={true}>
      {/* Header / Navbar */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-indigo-600">FormChat</h1>
        <div className="space-x-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium">Dashboard</Link>
          <Link href="/dashboard" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-gradient-to-b from-indigo-50/50 to-white">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Transform Forms into <span className="text-indigo-600">Conversations</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Build interactive chat-style forms, embed them on any website, and collect rich responses effortlessly.
        </p>
        <div className="space-x-4">
          <Link href="/dashboard" className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition">
            Create Free Form
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-8 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <h3 className="text-xl font-bold mb-2 text-indigo-600">Interactive Chat</h3>
          <p className="text-gray-600">Engage users by asking questions one at a time like a real conversation.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <h3 className="text-xl font-bold mb-2 text-indigo-600">Easy Embedding</h3>
          <p className="text-gray-600">Add a floating chatbot widget to any external website using a single JavaScript snippet.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <h3 className="text-xl font-bold mb-2 text-indigo-600">Dashboard Insights</h3>
          <p className="text-gray-600">Manage submissions, view stats, and track form statuses easily.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-gray-100 text-gray-500 text-sm">
        <p>© 2026 FormChat App. Built for Software Engineer Intern Task.</p>
      </footer>
    </div>
  );
}