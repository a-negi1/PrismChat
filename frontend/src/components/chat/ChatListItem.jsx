import { cn } from "@/utils/cn";
import { formatTime, isGroupChat } from "@/utils/helpers";
import AvatarWithBadge from "@/components/AvatarWithBadge";

const getPreview = (chat, currentUserId) => {
  const { lastMsg, members } = chat;
  const isGroup = isGroupChat(chat);

  if (!lastMsg) {
    return isGroup ? "Group created" : "Start a conversation";
  }
  if (lastMsg.fileType === "video")    return "🎥 Video";
  if (lastMsg.fileType === "audio")    return "🎵 Audio";
  if (lastMsg.fileType === "document") return "📄 Document";
  if (lastMsg.image || lastMsg.fileType === "image") return "📷 Photo";

  if (isGroup && lastMsg.senderName) {
    const who = lastMsg.senderId === currentUserId ? "You" : lastMsg.senderName;
    return `${who}: ${lastMsg.text || ""}`;
  }
  return lastMsg.text || "";
};

const ChatListItem = ({ chat, currentUserId, isActive, onClick }) => {
  const isGroup = isGroupChat(chat);
  const name    = isGroup ? chat.name : chat.name;
  const src     = chat.photoURL || "";
  const online  = !isGroup && chat.online;
  const time    = chat.lastMsg?.createdAt;
  const preview = getPreview(chat, currentUserId);
  const unread  = chat._unread || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-left",
        "hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent"
      )}
    >
      <AvatarWithBadge name={name} src={src} isOnline={online} isGroup={isGroup} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold truncate">{name}</span>
          {time && (
            <span className="text-[11px] text-muted-foreground ml-1 shrink-0">
              {formatTime(time)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={cn(
            "text-xs truncate",
            unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {preview}
          </p>
          {unread > 0 && (
            <span className="shrink-0 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ChatListItem;
