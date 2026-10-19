# FormChat - Interactive Form Builder & Chatbot Widget 🚀

A modern full-stack web application that allows users to create interactive forms, embed a chatbot widget on external websites, collect responses, and manage submissions through a clean dashboard.

---

## 🛠️ Tech Stack
- **Frontend & Backend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Database & Backend Services:** Supabase (PostgreSQL)
- **Deployment:** Vercel

---

## ✨ Key Features
- **Landing Page:** Clean, responsive design showcasing platform capabilities.
- **User Dashboard:** Real-time stats, form management (CRUD), and custom embed code generation.
- **Form Builder:** Add dynamic questions (Text, Email, Yes/No), configure requirements, and preview.
- **Chatbot Interface:** Conversational chat experience for end-users to submit responses seamlessly.
- **Embed Widget:** Floating JavaScript/iframe widget embeddable on any external website.
- **Responses Management:** View structured submission data with precise timestamps.

---

## ⚙️ Local Setup & Installation

Follow these steps to run the project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/form-chat-builder.git](https://github.com/YOUR_USERNAME/form-chat-builder.git)
   cd form-chat-builder

```

2. **Install dependencies:**
```bash
npm install

```


3. **Set up environment variables:**
Create a `.env.local` file in the root directory and add your Supabase configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```


4. **Run the development server:**
```bash
npm run dev

```


Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 💡 How to Use the Embed Widget

1. Go to your **User Dashboard**.
2. Click on the **"Embed Code"** button next to any created form.
3. Paste the generated HTML/iframe snippet into any external website to render the floating chatbot widget instantly.

```
