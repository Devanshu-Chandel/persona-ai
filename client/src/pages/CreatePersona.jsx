import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const inputClass =
  "rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-violet-500";

export default function CreatePersona() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    avatar: "🤖",
    systemPrompt: "",
    isPublic: false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/personas", { method: "POST", body: form });
      navigate("/");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-violet-400 hover:underline">
          ← Back
        </Link>
        <h1 className="mb-6 mt-4 text-2xl font-semibold">Create a persona</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <label className="flex w-24 flex-col gap-1 text-sm text-zinc-400">
              Emoji
              <input
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                maxLength={8}
                className={`${inputClass} text-center text-xl`}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-400">
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={50}
                required
                placeholder="e.g. Chef Marco"
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Tagline
            <input
              name="tagline"
              value={form.tagline}
              onChange={handleChange}
              maxLength={100}
              placeholder="e.g. Quick recipes from what's in your fridge"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Instructions (how should this persona behave?)
            <textarea
              name="systemPrompt"
              value={form.systemPrompt}
              onChange={handleChange}
              maxLength={2000}
              required
              rows={8}
              placeholder="You are a friendly chef. Suggest simple recipes, ask what ingredients the person has, and keep answers short."
              className={inputClass}
            />
            <span className="text-right text-xs">
              {form.systemPrompt.length}/2000
            </span>
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="isPublic"
              checked={form.isPublic}
              onChange={handleChange}
            />
            Make this persona public (other users can chat with it)
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            disabled={saving}
            className="rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create persona"}
          </button>
        </form>
      </div>
    </div>
  );
}