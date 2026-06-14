import { useEffect, useState } from "react";
import { X, MessageCircle, Users } from "lucide-react";
import { cn } from "@/utils/cn";

const Toast = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4500);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [toast.id, onDismiss]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
      className={cn(
        "flex items-start gap-3 w-72 px-4 py-3 rounded-xl border border-border bg-card shadow-lg cursor-pointer",
        "transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        {toast.isGroup
          ? <Users className="size-4 text-primary" />
          : <MessageCircle className="size-4 text-primary" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{toast.title}</p>
        <p className="text-xs text-muted-foreground truncate">{toast.body}</p>
      </div>
      <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
        <X className="size-3.5" />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => (
  <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2">
    {toasts.map((t) => (
      <Toast key={t.id} toast={t} onDismiss={onDismiss} />
    ))}
  </div>
);

export default ToastContainer;
