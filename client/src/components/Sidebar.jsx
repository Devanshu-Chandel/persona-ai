import { Link } from "react-router-dom";

export default function Sidebar({
  conversations,
  activeId,
  onDelete,
  onNewChat,
  personaName,
  showAll,
  onToggleAll,
}) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 md:flex">
      <div className="space-y-2 p-3">
        <button
          onClick={onNewChat}
          className="w-full rounded-lg bg-violet-600 px-3 py-2 font-medium text-white hover:bg-violet-500"
        >
          + New chat{personaName ? ` with ${personaName}` : ""}
        </button>
        <Link
          to="/"
          className="block text-center text-sm text-zinc-400 hover:text-violet-300"
        >
          ← All personas
        </Link>
      </div>

      <div className="flex items-center justify-between px-4 pb-2 text-xs text-zinc-500">
        <span>{showAll ? "All chats" : `${personaName ?? "Your"} chats`}</span>
        <button onClick={onToggleAll} className="hover:text-violet-300">
          {showAll ? "Show only this persona" : "Show all"}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 && (
          <p className="px-2 text-sm text-zinc-500">No chats yet.</p>
        )}

        {conversations.map((c) => (
          <div
            key={c._id}
            className={`group flex items-center gap-2 rounded-lg px-2 py-2 ${
              c._id === activeId ? "bg-zinc-800" : "hover:bg-zinc-800/60"
            }`}
          >
            <Link
              to={`/chat/${c._id}`}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <span className="text-xl">{c.persona?.avatar ?? "💬"}</span>
              <span className="truncate text-sm">{c.title}</span>
            </Link>
            <button
              onClick={() => onDelete(c._id)}
              aria-label="Delete chat"
              className="text-zinc-500 opacity-0 hover:text-red-400 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}