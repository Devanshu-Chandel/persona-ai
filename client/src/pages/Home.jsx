import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import PersonaCard from "../components/PersonaCard";

const gridClass = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

const flipLike = (list, id) =>
  list.map((p) =>
    p._id === id
      ? {
          ...p,
          likedByMe: !p.likedByMe,
          likesCount: p.likesCount + (p.likedByMe ? -1 : 1),
        }
      : p
  );

function Section({ title, subtitle, right, children }) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("popular");

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

  const startChat = (personaId) => navigate(`/chat/new/${personaId}`);

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

  const toggleLike = async (personaId) => {
    setError("");
    setPersonas((list) => flipLike(list, personaId)); // instant feedback
    try {
      const { liked, likesCount } = await api(`/personas/${personaId}/like`, {
        method: "POST",
      });
      setPersonas((list) =>
        list.map((p) =>
          p._id === personaId ? { ...p, likedByMe: liked, likesCount } : p
        )
      );
    } catch (err) {
      setPersonas((list) => flipLike(list, personaId)); // undo
      setError(err.message);
    }
  };

  const defaults = personas.filter((p) => !p.createdBy);
  const mine = personas.filter((p) => p.createdBy === user.id);
  const community = personas
    .filter((p) => p.createdBy && p.createdBy !== user.id)
    .sort((a, b) =>
      sort === "popular"
        ? b.likesCount - a.likesCount || b.usesCount - a.usesCount
        : new Date(b.createdAt) - new Date(a.createdAt)
    );

  const sortButton = (value, label) => (
    <button
      onClick={() => setSort(value)}
      className={`rounded-full px-3 py-1 text-sm ${
        sort === value
          ? "bg-violet-600 text-white"
          : "border border-zinc-700 text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );

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
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {loading && <p className="text-zinc-400">Loading personas...</p>}

        {!loading && (
          <>
            <Section
              title="Default personas"
              subtitle="Built-in personas to get you started."
            >
              <div className={gridClass}>
                {defaults.map((p) => (
                  <PersonaCard
                    key={p._id}
                    persona={p}
                    variant="default"
                    onStart={startChat}
                  />
                ))}
              </div>
            </Section>

            <Section
              title="Your personas"
              subtitle="Personas you created. Make one public to share it."
            >
              <div className={gridClass}>
                {mine.map((p) => (
                  <PersonaCard
                    key={p._id}
                    persona={p}
                    variant="mine"
                    onStart={startChat}
                    onDelete={removePersona}
                  />
                ))}
                <Link
                  to="/personas/new"
                  className="grid min-h-[140px] place-items-center rounded-2xl border border-dashed border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-violet-300"
                >
                  + Create your own
                </Link>
              </div>
            </Section>

            <Section
              title="Community"
              subtitle="Public personas made by other users."
              right={
                <div className="flex gap-2">
                  {sortButton("popular", "Popular")}
                  {sortButton("newest", "Newest")}
                </div>
              }
            >
              {community.length === 0 ? (
                <p className="text-zinc-500">
                  Nothing here yet. Make one of your personas public to be the
                  first!
                </p>
              ) : (
                <div className={gridClass}>
                  {community.map((p) => (
                    <PersonaCard
                      key={p._id}
                      persona={p}
                      variant="community"
                      onStart={startChat}
                      onLike={toggleLike}
                    />
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </main>
    </div>
  );
}