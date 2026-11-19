import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api("/personas")
      .then((data) => {
        if (!cancelled) setPersonas(data.personas);
      })
      .catch((err) => {
        if (err.status === 401) logout();
        else if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removePersona = async (personaId) => {
    if (
      !window.confirm(
        "Delete this persona? Existing chats with it will stop working."
      )
    )
      return;
    try {
      await api(`/personas/${personaId}`, { method: "DELETE" });
      setPersonas((list) => list.filter((p) => p._id !== personaId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold">Persona AI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{user.name}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-semibold">Who do you want to talk to?</h2>
        <p className="mb-8 mt-1 text-zinc-400">
          Pick a persona to start a conversation.
        </p>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {loading && <p className="text-zinc-400">Loading personas...</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => {
            const mine = p.createdBy === user.id;
            return (
              <div key={p._id} className="relative">
                <button
                  onClick={() => navigate(`/chat/new/${p._id}`)}
                  className="flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition hover:border-violet-500"
                >
                  <span className="text-4xl">{p.avatar}</span>
                  <span className="text-lg font-medium">{p.name}</span>
                  <span className="text-sm text-zinc-400">{p.tagline}</span>
                  {mine && (
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
                      {p.isPublic ? "Yours · public" : "Yours · private"}
                    </span>
                  )}
                </button>
                {mine && (
                  <button
                    onClick={() => removePersona(p._id)}
                    aria-label="Delete persona"
                    className="absolute right-3 top-3 text-zinc-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          <Link
            to="/personas/new"
            className="grid min-h-[140px] place-items-center rounded-2xl border border-dashed border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-violet-300"
          >
            + Create your own
          </Link>
        </div>
      </main>
    </div>
  );
}