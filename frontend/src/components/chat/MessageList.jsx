import { useRef, useEffect, useState, memo } from "react";
import { Reply } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate, formatTime, isGroupChat, docIcon } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import AvatarWithBadge from "@/components/AvatarWithBadge";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];


function groupByDate(messages) {
  return messages.reduce((acc, msg) => {
    const label = msg.createdAt ? formatDate(msg.createdAt) : "Just now";
    if (!acc.length || acc[acc.length - 1].label !== label) {
      acc.push({ label, msgs: [msg] });
    } else {
      acc[acc.length - 1].msgs.push(msg);
    }
    return acc;
  }, []);
}


const MessageMedia = ({ msg, onImageClick }) => {
  const fileType = msg.fileType || (msg.image ? "image" : "");
  const url      = msg.fileUrl  || msg.image || "";
  if (!fileType && !url) return null;

  if (fileType === "image" || (!fileType && msg.image)) {
    return (
      <img
        src={url || msg.image}
        alt="shared"
        onClick={() => onImageClick(url || msg.image)}
        className="rounded-lg max-w-[240px] cursor-zoom-in mt-1"
      />
    );
  }
  if (fileType === "video") {
    return <video src={url} controls preload="metadata" className="rounded-lg max-w-[260px] mt-1" />;
  }
  if (fileType === "audio") {
    return (
      <div className="flex items-center gap-2 mt-1">
        <span>🎵</span>
        <audio src={url} controls preload="metadata" className="max-w-[200px]" />
      </div>
    );
  }
  if (fileType === "document") {
    const fileName = msg.fileName || "Document";
    const isPdf    = fileName.split(".").pop().toLowerCase() === "pdf";
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        {...(!isPdf && { download: fileName })}
        className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors max-w-[240px]"
      >
        <span className="text-xl shrink-0">{docIcon(fileName)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{fileName}</p>
          <p className="text-[10px] text-muted-foreground">{isPdf ? "Open PDF" : "Download"}</p>
        </div>
        <span className="text-muted-foreground shrink-0">{isPdf ? "↗" : "↓"}</span>
      </a>
    );
  }
  return null;
};


const ReactionRow = ({ reactions, currentUserId }) => {
  if (!reactions?.length) return null;
  const counts = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
    acc[r.emoji].count++;
    if (r.userId === currentUserId) acc[r.emoji].mine = true;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(counts).map(([emoji, { count, mine }]) => (
        <span
          key={emoji}
          className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border",
            mine
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted border-border text-muted-foreground"
          )}
        >
          {emoji}
          {count > 1 && <span className="font-medium">{count}</span>}
        </span>
      ))}
    </div>
  );
};


const MessageBubble = memo(({ msg, isOwn, consecutive, isGroup, currentUser, activeChat, onImageClick, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);
  const timerRef = useRef();

  const showPickerHandler  = () => { clearTimeout(timerRef.current); setShowPicker(true); };
  const hidePickerHandler  = () => { timerRef.current = setTimeout(() => setShowPicker(false), 280); };
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const senderName      = isOwn ? "You" : msg.senderName || "";
  const replySenderName = msg.replyTo?.senderId === currentUser._id ? "You" : msg.replyTo?.senderName || "";

  return (
    <div
      className={cn("group flex gap-2 py-1 px-3", isOwn && "flex-row-reverse")}
      onMouseEnter={showPickerHandler}
      onMouseLeave={hidePickerHandler}
    >
      
      {!isOwn && (
        <div className="shrink-0 flex items-end">
          {!consecutive
            ? <AvatarWithBadge name={msg.senderName || "?"} src={activeChat?.photoURL || ""} size="size-7" />
            : <div className="size-7" />
          }
        </div>
      )}

      <div className={cn("max-w-[70%] flex flex-col", isOwn && "items-end")}>
        {/* Sender name + time (only first in a run) */}
        {!consecutive && (
          <div className={cn("flex items-center gap-1.5 mb-0.5 px-1", isOwn && "flex-row-reverse")}>
            {isGroup && <span className="text-[11px] font-semibold">{senderName}</span>}
            <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
          </div>
        )}

        <div className={cn("flex items-end gap-1.5", isOwn && "flex-row-reverse")}>
          {/* Bubble */}
          <div
            className={cn(
              "relative px-3.5 py-2 text-sm break-words",
              isOwn
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm"
                : cn(
                    "bg-card text-card-foreground rounded-2xl rounded-bl-sm",
                    "border border-border shadow-sm"
                  ),
              consecutive && (isOwn ? "rounded-tr-sm" : "rounded-tl-sm")
            )}
          >
            
            {msg.replyTo && (
              <div className={cn(
                "mb-2 px-2 py-1.5 rounded-md border-l-2 text-xs",
                isOwn
                  ? "bg-white/10 border-white/40"
                  : "bg-muted border-primary/50"
              )}>
                <p className="font-semibold mb-0.5">{replySenderName}</p>
                <p className="truncate max-w-[200px] opacity-80">
                  {msg.replyTo.image ? "📷 Photo" : msg.replyTo.text || ""}
                </p>
              </div>
            )}

            <MessageMedia msg={msg} onImageClick={onImageClick} />
            {msg.text && <p className="leading-snug">{msg.text}</p>}
          </div>

          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onReact && onReact(msg, null, "reply")}
            className={cn(
              "size-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
              isOwn && "scale-x-[-1]"
            )}
          >
            <Reply className="size-3.5 text-muted-foreground" />
          </Button>
        </div>

        
        {showPicker && (
          <div
            className={cn(
              "reaction-pop flex items-center gap-1 mt-1 px-2 py-1.5 rounded-full",
              "bg-popover border border-border shadow-lg z-10",
              isOwn ? "self-end" : "self-start"
            )}
            onMouseEnter={showPickerHandler}
            onMouseLeave={hidePickerHandler}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onReact(msg, emoji); setShowPicker(false); }}
                className="text-base hover:scale-125 transition-transform leading-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <ReactionRow reactions={msg.reactions} currentUserId={currentUser._id} />

        
        {consecutive && isOwn && (
          <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
        )}
      </div>
    </div>
  );
});
MessageBubble.displayName = "MessageBubble";


const MessageList = ({ messages, currentUser, activeChat, uploading, onImageClick, onReact }) => {
  const bottomRef = useRef();
  const isGroup   = isGroupChat(activeChat);
  const grouped   = groupByDate(messages);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto py-4">
        {grouped.map(({ label, msgs }) => (
          <div key={label}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4 px-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground font-medium px-2">{label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {msgs.map((msg, i) => {
              const isOwn       = msg.senderId === currentUser._id;
              const consecutive = i > 0 && msgs[i - 1].senderId === msg.senderId;
              return (
                <MessageBubble
                  key={msg._id || i}
                  msg={msg}
                  isOwn={isOwn}
                  consecutive={consecutive}
                  isGroup={isGroup}
                  currentUser={currentUser}
                  activeChat={activeChat}
                  onImageClick={onImageClick}
                  onReact={onReact}
                />
              );
            })}
          </div>
        ))}

        {uploading && (
          <div className="flex justify-end px-3 py-1">
            <div className="px-3 py-2 rounded-xl bg-primary/10 text-sm text-muted-foreground flex items-center gap-2">
              <span className="size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Uploading…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
