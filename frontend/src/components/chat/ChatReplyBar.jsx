import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatReplyBar = ({ replyTo, currentUserId, onCancel }) => {
  if (!replyTo) return null;
  const senderName = replyTo.senderId === currentUserId ? "You" : replyTo.senderName || "Someone";

  return (
    <div className="px-4 py-2 border-t border-border bg-card slide-up">
      <div className="max-w-4xl mx-auto flex items-start gap-2 px-3 py-2 rounded-lg border-l-4 border-primary bg-primary/5">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary mb-0.5">{senderName}</p>
          <p className="text-xs text-muted-foreground truncate max-w-xs">
            {replyTo.image ? "📷 Photo" : replyTo.text || ""}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={onCancel}>
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatReplyBar;
