const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export { API_URL };

export const api = {
  
  verifyFirebaseToken: (idToken, forceName = null) =>
    fetch(`${API_URL}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, forceName }),
    }).then((r) => r.json()),

  
  searchUsers: (q) =>
    fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),

  getUserChats: (userId) =>
    fetch(`${API_URL}/api/users/${userId}/chats`).then((r) => r.json()),

  updateUserPhoto: (userId, photoURL) =>
    fetch(`${API_URL}/api/users/${userId}/photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoURL }),
    }).then((r) => r.json()),

  updateUserName: (userId, name) =>
    fetch(`${API_URL}/api/users/${userId}/name`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => r.json()),

  
  getMessages: (chatId) =>
    fetch(`${API_URL}/api/messages/${chatId}`).then((r) => r.json()),

  markMessagesRead: (chatId, userId) =>
    fetch(`${API_URL}/api/messages/${chatId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).then((r) => r.json()),

  getUnreadCounts: (userId) =>
    fetch(`${API_URL}/api/messages/unread/${userId}`).then((r) => r.json()),

  reactToMessage: (messageId, userId, emoji) =>
    fetch(`${API_URL}/api/messages/${messageId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, emoji }),
    }).then((r) => r.json()),

  searchMessages: (userId, q) =>
    fetch(`${API_URL}/api/messages/search/${userId}?q=${encodeURIComponent(q)}`).then((r) => r.json()),

  
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_URL}/api/upload`, { method: "POST", body: formData }).then((r) => r.json());
  },

  
  createGroup: (name, adminId, memberIds) =>
    fetch(`${API_URL}/api/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, adminId, memberIds }),
    }).then((r) => r.json()),

  getUserGroups: (userId) =>
    fetch(`${API_URL}/api/groups/user/${userId}`).then((r) => r.json()),

  getGroup: (groupId) =>
    fetch(`${API_URL}/api/groups/${groupId}`).then((r) => r.json()),

  renameGroup: (groupId, name, requesterId) =>
    fetch(`${API_URL}/api/groups/${groupId}/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, requesterId }),
    }).then((r) => r.json()),

  addGroupMember: (groupId, userId, requesterId) =>
    fetch(`${API_URL}/api/groups/${groupId}/add`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, requesterId }),
    }).then((r) => r.json()),

  leaveGroup: (groupId, userId) =>
    fetch(`${API_URL}/api/groups/${groupId}/leave`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).then((r) => r.json()),

  updateGroupPhoto: (groupId, photoURL, requesterId) =>
    fetch(`${API_URL}/api/groups/${groupId}/photo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoURL, requesterId }),
    }).then((r) => r.json()),
};
