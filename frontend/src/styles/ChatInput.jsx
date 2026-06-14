import { useRef } from "react";

export default function ChatInput({ input, setInput, onSend, onFileUpload, uploading, sending, activeChat }) {
  const fileInputRef = useRef();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-area">
      <div className="chat-input-row">
        <div className="chat-input-box">
          <textarea
            className="chat-input"
            placeholder={`Message ${activeChat.name}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <label
            className="btn-attach"
            title="Send file, image, video, audio or document"
            style={{ opacity: uploading ? 0.4 : 1, pointerEvents: uploading ? "none" : "auto" }}
          >
            {uploading ? <span className="spinner" style={{ width: 15, height: 15 }} /> : "📎"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              style={{ display: "none" }}
              onChange={onFileUpload}
            />
          </label>
        </div>
        <button className="btn-send" onClick={onSend} disabled={!input.trim() || sending}>
          {sending
            ? <span className="spinner" style={{ width: 15, height: 15 }} />
            : "➤"}
        </button>
      </div>

    </div>
  );
}
