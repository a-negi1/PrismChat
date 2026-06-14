import { useRef, useState } from "react";
import { Paperclip, Send, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import ChatReplyBar from "./ChatReplyBar";
import { isGroupChat } from "@/utils/helpers";

const ChatInput = ({
  input, setInput,
  onSend, onFileUpload,
  uploading, sending,
  activeChat,
  replyTo, onCancelReply,
  currentUserId,
  currentUserName,
  emitTyping,
  emitStopTyping,
}) => {
  const fileRef = useRef();
  const [imgPreview, setImgPreview] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const isTypingRef = useRef(false);
  const typingTimer = useRef(null);

  const stopTypingNow = () => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    if (!activeChat || !emitStopTyping) return;
    const isGroup = isGroupChat(activeChat);
    emitStopTyping(
      isGroup
        ? { senderId: currentUserId, groupId: activeChat._id }
        : { senderId: currentUserId, receiverId: activeChat._id }
    );
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!activeChat || !emitTyping) return;
    const isGroup = isGroupChat(activeChat);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(
        isGroup
          ? { senderId: currentUserId, senderName: currentUserName, groupId: activeChat._id }
          : { senderId: currentUserId, senderName: currentUserName, receiverId: activeChat._id }
      );
    }


    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTypingNow, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setImgPreview(reader.result);
      reader.readAsDataURL(file);
      setImgFile(file);
    } else {
      onFileUpload(e);
    }
    e.target.value = "";
  };

  const handleSend = () => {
    stopTypingNow();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (imgFile) {
      onFileUpload({ target: { files: [imgFile] } });
      setImgPreview(null);
      setImgFile(null);
    }
    if (input.trim()) onSend();
  };

  const removeImg = () => { setImgPreview(null); setImgFile(null); };

  return (
    <div className="shrink-0">
      <ChatReplyBar replyTo={replyTo} currentUserId={currentUserId} onCancel={onCancelReply} />


      {imgPreview && (
        <div className="px-4 pt-2 max-w-4xl mx-auto overflow-hidden">
          <div className="relative w-fit">
            <img src={imgPreview} alt="preview" className="h-16 rounded-lg object-cover" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-1 -right-1 size-5 bg-black/60 text-white rounded-full hover:bg-black/80"
              onClick={removeImg}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-border bg-card px-4">
        <div className="max-w-4xl mx-auto py-3 flex items-center gap-2">

          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-full shrink-0"
            disabled={uploading || sending}
            onClick={() => fileRef.current?.click()}
            title="Attach file"
          >
            <Paperclip className="size-4" />
          </Button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
            onChange={handleFileChange}
          />

          {/* Textarea */}
          <div className="flex-1 min-w-0 relative">
            <textarea
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeChat?.name || ""}…`}
              disabled={sending || uploading}
              className={cn(
                "w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
                "disabled:opacity-50 transition-colors",
                "max-h-32 overflow-y-auto"
              )}
            />
          </div>


          <Button
            size="icon"
            className="size-9 rounded-full shrink-0"
            onClick={handleSend}
            disabled={(!input.trim() && !imgFile) || sending || uploading}
          >
            {sending || uploading
              ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="size-4" />
            }
          </Button>
        </div>

        <div className="h-7" />
      </div>
    </div>
  );
};

export default ChatInput;

