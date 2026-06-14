import { useRef, useState } from "react";
import Avatar from "../ui/Avatar";
import CreateGroupModal from "./CreateGroupModal";
import { formatTime, initials, getChatId, getGroupChatId, isGroupChat } from "../../utils/helpers";

export default function Sidebar({
  currentUser,
  chats,
  groups,
  activeChat,
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  onSelectChat,
  onSelectGroup,
  onGroupCreated,
  onSignOut,
  isOpen,
  onClose,
  unreadCounts = {},
  onUpdatePhoto,
}) {
  const [tab, setTab]             = useState("chats");   // "chats" | "groups"
  const [showNewGroup, setShowNewGroup] = useState(false);
  const searchWrapRef             = useRef();
  const photoInputRef             = useRef();

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await onUpdatePhoto(file);
    e.target.value = "";
  };

  const handleGroupCreated = (group) => {
    setShowNewGroup(false);
    onGroupCreated(group);
  };

  return (
    <>
      <div className={`sidebar${isOpen ? " mobile-open" : ""}`}>
        
        <div className="sidebar-header">
          <div className="sidebar-logo-wrap">
            <div className="sidebar-logo-icon">💬</div>
            <span className="sidebar-logo">Prism Chat</span>
          </div>
          <button
            className="btn-icon"
            title="New group"
            onClick={() => setShowNewGroup(true)}
            style={{ fontSize: 16 }}
          >
            👥
          </button>
          <button className="btn-icon" title="Sign out" onClick={onSignOut}>⏻</button>
        </div>

        
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab${tab === "chats" ? " active" : ""}`}
            onClick={() => setTab("chats")}
          >
            💬 Chats
          </button>
          <button
            className={`sidebar-tab${tab === "groups" ? " active" : ""}`}
            onClick={() => setTab("groups")}
          >
            👥 Groups
          </button>
        </div>

        
        {tab === "chats" && (
          <div className="search-wrap" ref={searchWrapRef}>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Search users…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searching && <span className="spinner" style={{ width: 13, height: 13 }} />}
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((u) => (
                  <div className="search-result-item" key={u._id} onClick={() => onSelectChat(u)}>
                    <div className="avatar sm">
                      {u.photoURL ? <img src={u.photoURL} alt={u.name} /> : initials(u.name)}
                    </div>
                    <div>
                      <div className="search-result-name">{u.name}</div>
                      <div className="search-result-email">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        
        <div className="chat-list">
          {tab === "chats" ? (
            chats.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-2)", fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
                Search for users above<br />to start a conversation
              </div>
            ) : (
              <>
                <div className="section-label">Messages</div>
                {chats.map((chat, i) => {
                  const chatId = getChatId(currentUser._id, chat._id);
                  const unread = unreadCounts[chatId] || 0;
                  return (
                    <div
                      key={chat._id}
                      className={`chat-item ${activeChat?._id === chat._id && !isGroupChat(activeChat) ? "active" : ""}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                      onClick={() => onSelectChat(chat)}
                    >
                      <div className="chat-item-avatar">
                        <div className="avatar">
                          {chat.photoURL ? <img src={chat.photoURL} alt={chat.name} /> : initials(chat.name)}
                        </div>
                        {chat.online && <div className="online-dot" />}
                      </div>
                      <div className="chat-item-info">
                        <div className="chat-item-name">{chat.name}</div>
                        <div className="chat-item-preview" style={unread > 0 ? { color: "var(--text-0)", fontWeight: 600 } : {}}>
                          {chat.lastMsg?.fileType === "video"    ? "🎥 Video"
                            : chat.lastMsg?.fileType === "audio"   ? "🎵 Audio"
                            : chat.lastMsg?.fileType === "document" ? "📄 Document"
                            : chat.lastMsg?.image                   ? "📷 Image"
                            : chat.lastMsg?.text                    || "Start a conversation"}
                        </div>
                      </div>
                      <div className="chat-item-meta">
                        {chat.lastMsg?.createdAt && (
                          <div className="chat-item-time">{formatTime(chat.lastMsg.createdAt)}</div>
                        )}
                        {unread > 0 && activeChat?._id !== chat._id && (
                          <div className="unread-badge">{unread > 99 ? "99+" : unread}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )
          ) : (
            
            groups.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-2)", fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>👥</div>
                No groups yet<br />
                <span
                  style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                  onClick={() => setShowNewGroup(true)}
                >
                  Create one →
                </span>
              </div>
            ) : (
              <>
                <div className="section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 10 }}>
                  <span>Groups</span>
                  <span
                    style={{ color: "var(--accent)", cursor: "pointer", fontSize: 10, fontWeight: 700 }}
                    onClick={() => setShowNewGroup(true)}
                  >
                    + New
                  </span>
                </div>
                {groups.map((group, i) => {
                  const chatId = getGroupChatId(group._id);
                  const unread = unreadCounts[chatId] || 0;
                  const isActive = isGroupChat(activeChat) && activeChat._id === group._id;
                  return (
                    <div
                      key={group._id}
                      className={`chat-item ${isActive ? "active" : ""}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                      onClick={() => onSelectGroup(group)}
                    >
                      <div className="chat-item-avatar">
                        <div className="avatar" style={{ background: "var(--bg-5)", fontSize: 12 }}>
                          {group.photoURL
                            ? <img src={group.photoURL} alt={group.name} />
                            : initials(group.name)}
                        </div>
                      </div>
                      <div className="chat-item-info">
                        <div className="chat-item-name">{group.name}</div>
                        <div className="chat-item-preview" style={unread > 0 ? { color: "var(--text-0)", fontWeight: 600 } : {}}>
                          {group.lastMsg
                            ? group.lastMsg.fileType === "video"    ? `${group.lastMsg.senderName}: 🎥 Video`
                            : group.lastMsg.fileType === "audio"    ? `${group.lastMsg.senderName}: 🎵 Audio`
                            : group.lastMsg.fileType === "document" ? `${group.lastMsg.senderName}: 📄 Document`
                            : group.lastMsg.image                   ? `${group.lastMsg.senderName}: 📷 Image`
                            : `${group.lastMsg.senderName}: ${group.lastMsg.text}`
                            : `${group.members?.length || 0} members`}
                        </div>
                      </div>
                      <div className="chat-item-meta">
                        {group.lastMsg?.createdAt && (
                          <div className="chat-item-time">{formatTime(group.lastMsg.createdAt)}</div>
                        )}
                        {unread > 0 && !isActive && (
                          <div className="unread-badge">{unread > 99 ? "99+" : unread}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )
          )}
        </div>

        
        <div className="sidebar-user">
          <div className="sidebar-user-avatar-wrap" onClick={() => photoInputRef.current.click()} title="Change profile photo">
            <Avatar user={currentUser} size="sm" />
            <div className="sidebar-user-avatar-overlay">📷</div>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoChange}
          />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser.name}</div>
            <div className="sidebar-user-status">
              <span className="status-dot" /> Online
            </div>
          </div>
          <div
            className="btn-icon"
            title="Change profile photo"
            onClick={() => photoInputRef.current.click()}
            style={{ cursor: "pointer", fontSize: 13 }}
          >
            ✏️
          </div>
        </div>
      </div>

      
      {showNewGroup && (
        <CreateGroupModal
          currentUser={currentUser}
          onClose={() => setShowNewGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </>
  );
}
