import { useState, useEffect } from "react";
import { Search, Bot } from "lucide-react";
import { cn } from "@/utils/cn";
import { isGroupChat, getChatId, getGroupChatId } from "@/utils/helpers";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/services/api";
import ChatListItem from "./ChatListItem";
import { NewChatPopover } from "./NewChatPopover";

const TABS = ["Chats", "Groups", "AI"];

const resolveChatFromMessage = (msg, currentUserId, chats, groups) => {
  if (msg.chatId.startsWith("group_")) {
    const groupId = msg.chatId.replace("group_", "");
    return groups.find((g) => g._id === groupId) || null;
  }
  const partnerId = msg.chatId.split("_").find((id) => id !== currentUserId);
  return chats.find((c) => c._id === partnerId) || null;
};

const ChatSidebar = ({
  currentUser,
  chats,
  groups,
  activeChat,
  unreadCounts,
  onSelectChat,
  onSelectGroup,
  onGroupCreated,
  onSelectAI,
  isAIActive,
  isOpen,
  onClose,
}) => {
  const [tab, setTab] = useState("Chats");
  const [query, setQuery] = useState("");
  const [msgResults, setMsgResults] = useState([]);
  const [msgSearching, setMsgSearching] = useState(false);

  
  useEffect(() => {
    if (!query.trim()) {
      setMsgResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setMsgSearching(true);
      try {
        const data = await api.searchMessages(currentUser._id, query.trim());
        setMsgResults(Array.isArray(data) ? data : []);
      } catch {
        setMsgResults([]);
      }
      setMsgSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, currentUser._id]);

  const q = query.toLowerCase().trim();

  const filteredChats = chats.filter((c) =>
    !q ||
    c.name?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    msgResults.some((m) => {
      const chat = resolveChatFromMessage(m, currentUser._id, chats, groups);
      return chat && chat._id === c._id && !isGroupChat(chat);
    })
  );

  const filteredGroups = groups.filter((g) =>
    !q ||
    g.name?.toLowerCase().includes(q) ||
    msgResults.some((m) => m.chatId === getGroupChatId(g._id))
  );

  const withUnread = (item, chatId) => ({
    ...item,
    _unread: unreadCounts[chatId] || 0,
  });

  // Group message hits by chat, keep most recent match per chat
  const messageHits = q
    ? msgResults.reduce((acc, msg) => {
      const chat = resolveChatFromMessage(msg, currentUser._id, chats, groups);
      if (!chat) return acc;
      const key = msg.chatId;
      if (!acc[key] || new Date(msg.createdAt) > new Date(acc[key].createdAt)) {
        acc[key] = { msg, chat };
      }
      return acc;
    }, {})
    : {};

  const messageHitList = Object.values(messageHits);

  const handleMessageHitClick = (hit) => {
    if (isGroupChat(hit.chat)) onSelectGroup(hit.chat);
    else onSelectChat(hit.chat);
    onClose();
  };

  const searching = msgSearching && q.length > 0;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[97] bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-11 z-[98] w-72 flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="px-3 pt-3 pb-2 border-b border-sidebar-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold">Messages</h1>
            <NewChatPopover
              currentUser={currentUser}
              onChatStarted={(user) => { onSelectChat(user); onClose(); }}
              onGroupCreated={(group) => { onGroupCreated(group); onClose(); }}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search messages or chats…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-background"
            />
            {searching && (
              <Spinner className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5" />
            )}
          </div>
        </div>

        <div className="flex border-b border-sidebar-border shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "AI") { onSelectAI(); onClose(); } }}
              className={cn(
                "flex-1 py-2 text-xs font-medium transition-colors",
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "AI" ? <span className="flex items-center justify-center gap-1"><Bot className="size-3" />{t}</span> : t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {/* Message search results */}
          {q && messageHitList.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">
                Message matches
              </p>
              {messageHitList.map(({ msg, chat }) => (
                <button
                  key={msg._id}
                  onClick={() => handleMessageHitClick({ msg, chat })}
                  className="w-full flex flex-col gap-0.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left"
                >
                  <span className="text-xs font-semibold truncate">{chat.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {msg.senderName ? `${msg.senderName}: ` : ""}{msg.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          {q && !searching && messageHitList.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-3 px-2">
              No messages matching &ldquo;{query}&rdquo;
            </p>
          )}

          {tab === "Chats" && (
            filteredChats.length === 0
              ? <Empty query={query} label="chat" />
              : filteredChats.map((c) => (
                <ChatListItem
                  key={c._id}
                  chat={withUnread(c, getChatId(currentUser._id, c._id))}
                  currentUserId={currentUser._id}
                  isActive={!isGroupChat(activeChat) && activeChat?._id === c._id}
                  onClick={() => { onSelectChat(c); onClose(); }}
                />
              ))
          )}

          {tab === "Groups" && (
            filteredGroups.length === 0
              ? <Empty query={query} label="group" />
              : filteredGroups.map((g) => (
                <ChatListItem
                  key={g._id}
                  chat={withUnread(g, getGroupChatId(g._id))}
                  currentUserId={currentUser._id}
                  isActive={isGroupChat(activeChat) && activeChat?._id === g._id}
                  onClick={() => { onSelectGroup(g); onClose(); }}
                />
              ))
          )}

          {tab === "AI" && (
            <button
              onClick={() => { onSelectAI(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-left",
                "hover:bg-sidebar-accent",
                isAIActive && "bg-sidebar-accent"
              )}
            >
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Prism AI</p>
                <p className="text-xs text-muted-foreground truncate">Ask me anything…</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

const Empty = ({ query, label }) => (
  <div className="text-center text-sm text-muted-foreground py-10">
    {query ? `No ${label}s matching "${query}"` : `No ${label}s yet`}
  </div>
);

export default ChatSidebar;
