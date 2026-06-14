import { ArrowLeft, Info, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import AvatarWithBadge from "@/components/AvatarWithBadge";
import { isGroupChat, formatLastSeen } from "@/utils/helpers";
import { cn } from "@/utils/cn";

const ChatHeader = ({ activeChat, onToggleProfile, onBack, isAI = false }) => {
  if (isAI) {
    return (
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="icon" className="size-8 md:hidden" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Prism AI</p>
          <p className="text-xs text-green-500">Always online</p>
        </div>
      </div>
    );
  }

  const isGroup    = isGroupChat(activeChat);
  const name       = activeChat.name;
  const src        = activeChat.photoURL || "";
  const isOnline   = !isGroup && activeChat.online === true;
  const subheading = isGroup
    ? `${activeChat.members?.length || 0} members`
    : isOnline
      ? "Active now"
      : formatLastSeen(activeChat.lastSeen);

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
      <Button variant="ghost" size="icon" className="size-8 lg:hidden" onClick={onBack}>
        <ArrowLeft className="size-4" />
      </Button>

      <AvatarWithBadge name={name} src={src} isOnline={isOnline} isGroup={isGroup} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{name}</p>
        <p className={cn("text-xs truncate", isOnline ? "text-green-500" : "text-muted-foreground")}>
          {subheading}
        </p>
      </div>

      <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onToggleProfile} title="Info">
        <Info className="size-4" />
      </Button>
    </div>
  );
};

export default ChatHeader;
