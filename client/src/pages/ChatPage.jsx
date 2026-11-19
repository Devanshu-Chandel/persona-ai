import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Sidebar from "../components/Sidebar";
import Markdown from "../components/Markdown";

export default function ChatPage() {
  const { id, personaId } = useParams();
  const isDraft = !id; // /chat/new/:personaId has no conversation yet
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [draftPersona, setDraftPersona] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!isDraft);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const bottomRef = useRef(null);
  const skipLoadFor = useRef(null);

  const persona = isDraft
    ? draftPersona
    : conversations.find((c) => c._id === id)?.persona;

  const visibleConversations =
    showAll || !persona
      ? conversations
      : conversations.filter((c) => c.persona?._id === persona._id);

  const handleError = (err) => {
    if (err.status === 401) logout();
    else setError(err.message);
  };

  // sidebar list: load once
  useEffect(() => {
    api("/conversations")
      .then((data) => setConversations(data.conversations))
      .catch(handleError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // draft mode: look up the persona for the header
  useEffect(() => {
    if (!isDraft) return;
    let cancelled = false;
    setDraftPersona(null);

    api("/personas")
      .then((data) => {
        if (cancelled) return;
        const found = data.personas.find((p) => p._id === personaId);
        if (found) setDraftPersona(found);
        else navigate("/", { replace: true });
      })
      .catch((err) => {
        if (!cancelled) handleError(err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraft, personaId]);

  // messages: reload whenever the chat changes
  useEffect(() => {
    if (isDraft) {
      setMessages([]);
      setError("");
      setLoading(false);
      return;
    }

    // we just created this chat and already hold its messages
    if (skipLoadFor.current === id) {
      skipLoadFor.current = null;
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setMessages([]);

    api(`/conversations/${id}/messages`)
      .then((data) => {
        if (!cancelled) setMessages(data.messages);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) navigate("/", { replace: true });
        else handleError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, personaId]);

  // keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (isDraft && !draftPersona) return;

    setInput("");
    setError("");
    setSending(true);

    const temp = { _id: `temp-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, temp]);

    let created = null;
    try {
      let convId = id;

      // first message of a draft: create the conversation now
      if (isDraft) {
        const { conversation } = await api("/conversations", {
          method: "POST",
          body: { personaId },
        });
        created = conversation;
        convId = conversation._id;
      }

      const data = await api(`/conversations/${convId}/messages`, {
        method: "POST",
        body: { content: text },
      });

      setMessages((m) => [
        ...m.filter((x) => x._id !== temp._id),
        data.userMessage,
        data.assistantMessage,
      ]);

      if (created) {
        setConversations((list) => [
          { ...created, persona: draftPersona, title: data.title },
          ...list,
        ]);
        skipLoadFor.current = convId;
        navigate(`/chat/${convId}`, { replace: true });
      } else {
        setConversations((list) => {
          const cur = list.find((c) => c._id === id);
          if (!cur) return list;
          return [
            { ...cur, title: data.title },
            ...list.filter((c) => c._id !== id),
          ];
        });
      }
    } catch (err) {
      // don't leave an empty conversation behind if the first message failed
      if (created) {
        api(`/conversations/${created._id}`, { method: "DELETE" }).catch(
          () => {}
        );
      }
      setMessages((m) => m.filter((x) => x._id !== temp._id));
      setInput(text);
      handleError(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const newChat = () => {
    if (persona?._id) navigate(`/chat/new/${persona._id}`);
    else navigate("/");
  };

  const removeConversation = async (convId) => {
    if (!window.confirm("Delete this chat?")) return;
    try {
      await api(`/conversations/${convId}`, { method: "DELETE" });
      setConversations((list) => list.filter((c) => c._id !== convId));
      if (convId === id) navigate("/");
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar
        conversations={visibleConversations}
        activeId={id}
        onDelete={removeConversation}
        onNewChat={newChat}
        personaName={persona?.name}
        showAll={showAll}
        onToggleAll={() => setShowAll((v) => !v)}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
          <span className="text-2xl">{persona?.avatar}</span>
          <h2 className="font-medium">{persona?.name ?? "Chat"}</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {loading && <p className="text-zinc-400">Loading messages...</p>}

            {!loading && messages.length === 0 && (
              <p className="py-10 text-center text-zinc-500">
                Say hello to start the conversation.
              </p>
            )}

                       {messages.map((m) => (
              <div
                key={m._id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "user" ? (
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-violet-600 px-4 py-2.5 text-white">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl bg-zinc-800 px-4 py-2.5">
                    <Markdown>{m.content}</Markdown>
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-zinc-800 px-4 py-2.5 text-zinc-400">
                  <span className="animate-pulse">Typing...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-zinc-800 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message (Enter to send, Shift+Enter for a new line)"
                className="max-h-40 flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 outline-none focus:border-violet-500"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="rounded-xl bg-violet-600 px-5 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}