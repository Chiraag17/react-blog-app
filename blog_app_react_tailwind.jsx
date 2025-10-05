import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "blog_posts";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    console.error("Failed to load posts", e);
    return [];
  }
}

function Excerpt({ content, length = 150 }) {
  const txt = content.replace(/\s+/g, " ").trim();
  return txt.length <= length ? txt : txt.slice(0, length).trim() + "...";
}

export default function App() {
  const [posts, setPosts] = useState(loadPosts);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", author: "", content: "" });
  const [errors, setErrors] = useState({});
  const [query, setQuery] = useState("");
  const titleRef = useRef(null);

  useEffect(() => savePosts(posts), [posts]);
  useEffect(() => {
    if (editing) setTimeout(() => titleRef.current?.focus(), 50);
  }, [editing]);

  function resetForm() {
    setForm({ title: "", author: "", content: "" });
    setErrors({});
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.author.trim()) errs.author = "Author is required";
    if (!form.content.trim()) errs.content = "Content is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing === "new") {
      const newPost = { id: uid(), ...form, date: new Date().toISOString() };
      setPosts([newPost, ...posts]);
      setViewing(newPost.id);
    } else {
      setPosts(posts.map(p => (p.id === editing ? { ...p, ...form } : p)));
      setViewing(editing);
    }
    setEditing(null);
    resetForm();
  }

  const filtered = posts.filter(p => {
    const q = query.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">📝 Modern Blog</h1>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search posts..."
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button onClick={() => { resetForm(); setEditing("new"); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-medium shadow">
              + New Post
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {filtered.length ? (
                filtered.map(post => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white/90 backdrop-blur-md rounded-2xl shadow hover:shadow-lg transition-all p-6 border border-slate-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h2
                          onClick={() => setViewing(post.id)}
                          className="text-xl font-semibold text-slate-800 hover:text-indigo-600 cursor-pointer transition"
                        >
                          {post.title}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">by {post.author} • {new Date(post.date).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setForm(post); setEditing(post.id); }} className="text-sm px-3 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200">Edit</button>
                        <button onClick={() => setPosts(posts.filter(p => p.id !== post.id))} className="text-sm px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-600">Delete</button>
                      </div>
                    </div>
                    <p className="mt-3 text-slate-700 text-sm leading-relaxed"><Excerpt content={post.content} /></p>
                  </motion.article>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/70 rounded-2xl p-6 text-center text-slate-500 shadow-sm">
                  No posts found. Click <span className="font-semibold text-indigo-600">New Post</span> to start!
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <aside className="bg-white/90 rounded-2xl shadow-md p-6 border border-slate-100 backdrop-blur-sm">
            <h3 className="font-semibold text-lg mb-3 text-indigo-700">{editing ? (editing === "new" ? "Create Post" : "Edit Post") : "Create / Edit"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {['title', 'author', 'content'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium capitalize">{field}</label>
                  {field === 'content' ? (
                    <textarea
                      rows={6}
                      value={form[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 ${errors[field] ? 'border-red-400' : 'border-slate-200'}`}
                    />
                  ) : (
                    <input
                      ref={field === 'title' ? titleRef : null}
                      type="text"
                      value={form[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 ${errors[field] ? 'border-red-400' : 'border-slate-200'}`}
                    />
                  )}
                  {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                </div>
              ))}

              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition shadow">{editing === "new" ? "Create" : "Save"}</button>
                <button type="button" onClick={() => { setEditing(null); resetForm(); }} className="px-4 py-2 border rounded-xl hover:bg-slate-100">Cancel</button>
              </div>
            </form>
            <p className="text-xs text-slate-400 mt-4">{posts.length} total posts</p>
          </aside>
        </main>

        <AnimatePresence>
          {viewing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setViewing(null)}></div>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-3xl w-full bg-white rounded-2xl shadow-lg p-8 z-10">
                <h2 className="text-2xl font-bold text-indigo-700">{posts.find(p => p.id === viewing)?.title}</h2>
                <p className="text-sm text-slate-500 mt-1">by {posts.find(p => p.id === viewing)?.author} • {new Date(posts.find(p => p.id === viewing)?.date).toLocaleString()}</p>
                <article className="mt-4 text-slate-700 leading-relaxed whitespace-pre-wrap">{posts.find(p => p.id === viewing)?.content}</article>
                <div className="flex justify-end mt-6 gap-3">
                  <button className="px-4 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200" onClick={() => { setForm(posts.find(p => p.id === viewing)); setEditing(viewing); setViewing(null); }}>Edit</button>
                  <button className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600" onClick={() => setPosts(posts.filter(p => p.id !== viewing))}>Delete</button>
                  <button className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200" onClick={() => setViewing(null)}>Close</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
