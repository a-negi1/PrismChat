export const parseDate = (ts) => {
  if (!ts) return null;
  const d = ts instanceof Date ? ts : new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatTime = (ts) => {
  const d = parseDate(ts);
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDate = (ts) => {
  const d = parseDate(ts);
  if (!d) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const formatLastSeen = (ts) => {
  const d = parseDate(ts);
  if (!d) return "Offline";

  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Last seen just now";
  if (diffMin < 60) return `Last seen ${diffMin} min ago`;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (d.toDateString() === today.toDateString()) return `Last seen today at ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Last seen yesterday at ${time}`;

  const date = d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
  return `Last seen ${date} at ${time}`;
};

export const getChatId   = (a, b)      => [a, b].sort().join("_");
export const getGroupChatId = (groupId) => `group_${groupId}`;
export const isGroupChat    = (chat)    => Boolean(chat?.members);

export const initials = (n) =>
  n ? n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";

export const docIcon = (fileName = "") => {
  const ext = fileName.split(".").pop().toLowerCase();
  const map = { pdf:"📄", doc:"📝", docx:"📝", xls:"📊", xlsx:"📊", ppt:"📑", pptx:"📑", zip:"🗜️", txt:"📃" };
  return map[ext] || "📁";
};
