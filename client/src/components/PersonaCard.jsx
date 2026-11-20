const chatsLabel = (n) => `${n} ${n === 1 ? "chat" : "chats"}`;

export default function PersonaCard({
  persona: p,
  variant,
  onStart,
  onDelete,
  onLike,
}) {
  return (
    <div className="relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 transition hover:border-violet-500">
      <button
        onClick={() => onStart(p._id)}
        className="flex flex-1 flex-col items-start gap-2 p-5 text-left"
      >
        <span className="text-4xl">{p.avatar}</span>
        <span className="text-lg font-medium">{p.name}</span>
        <span className="text-sm text-zinc-400">{p.tagline}</span>
      </button>

      {variant === "mine" && (
        <>
          <button
            onClick={() => onDelete(p._id)}
            aria-label="Delete persona"
            className="absolute right-3 top-3 text-zinc-500 hover:text-red-400"
          >
            ✕
          </button>
          <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3 text-sm text-zinc-400">
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
              {p.isPublic ? "Public" : "Private"}
            </span>
            {p.isPublic && (
              <span>
                ♥ {p.likesCount} · {chatsLabel(p.usesCount)}
              </span>
            )}
          </div>
        </>
      )}

      {variant === "community" && (
        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-5 py-3 text-sm text-zinc-400">
          <span className="truncate">by {p.creatorName}</span>
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => onLike(p._id)}
              aria-pressed={p.likedByMe}
              aria-label={p.likedByMe ? "Unlike" : "Like"}
              className={p.likedByMe ? "text-pink-400" : "hover:text-pink-300"}
            >
              {p.likedByMe ? "♥" : "♡"} {p.likesCount}
            </button>
            <span>{chatsLabel(p.usesCount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}