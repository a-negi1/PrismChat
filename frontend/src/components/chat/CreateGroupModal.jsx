import { useState } from "react";
import { api } from "../../services/api";
import { initials } from "../../utils/helpers";

export default function CreateGroupModal({ currentUser, onClose, onGroupCreated }) {
  const [groupName, setGroupName]    = useState("");
  const [searchQ, setSearchQ]        = useState("");
  const [searchResults, setSearchRes] = useState([]);
  const [selectedUsers, setSelected] = useState([]);
  const [searching, setSearching]    = useState(false);
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState("");

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (!q.trim()) { setSearchRes([]); return; }
    setSearching(true);
    try {
      const data = await api.searchUsers(q);
      setSearchRes(
        data.filter(
          (u) => u._id !== currentUser._id && !selectedUsers.find((s) => s._id === u._id)
        )
      );
    } catch (e) {
      setSearchRes([]);
    }
    setSearching(false);
  };

  const addUser = (user) => {
    setSelected((prev) => [...prev, user]);
    setSearchRes((prev) => prev.filter((u) => u._id !== user._id));
    setSearchQ("");
  };

  const removeUser = (userId) =>
    setSelected((prev) => prev.filter((u) => u._id !== userId));

  const handleCreate = async () => {
    if (!groupName.trim()) return setError("Please enter a group name.");
    if (selectedUsers.length < 1) return setError("Add at least 1 member.");
    setError("");
    setLoading(true);
    try {
      const group = await api.createGroup(
        groupName.trim(),
        currentUser._id,
        selectedUsers.map((u) => u._id)
      );
      if (group.error) throw new Error(group.error);
      onGroupCreated(group);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        
        <div className="modal-header">
          <span className="modal-title">New Group</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="error-msg" style={{ margin: "0 0 14px" }}>⚠️ {error}</div>
        )}

        
        <div className="field-label" style={{ marginBottom: 6 }}>Group Name</div>
        <input
          className="field-input"
          placeholder="e.g. Design Team"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={{ marginBottom: 18 }}
        />

       
        <div className="field-label" style={{ marginBottom: 6 }}>Add Members</div>

        
        {selectedUsers.length > 0 && (
          <div className="member-chips">
            {selectedUsers.map((u) => (
              <div className="member-chip" key={u._id}>
                <div className="avatar sm" style={{ width: 22, height: 22, fontSize: 10 }}>
                  {u.photoURL ? <img src={u.photoURL} alt={u.name} /> : initials(u.name)}
                </div>
                <span>{u.name}</span>
                <button className="chip-remove" onClick={() => removeUser(u._id)}>✕</button>
              </div>
            ))}
          </div>
        )}

        
        <div className="modal-search-box">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search by name or email…"
            value={searchQ}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searching && <span className="spinner" style={{ width: 13, height: 13 }} />}
        </div>

        {/* Results — inline, NOT absolute positioned */}
        {searchQ.trim() && (
          <div className="modal-search-results">
            {searching ? (
              <div className="modal-search-empty">Searching…</div>
            ) : searchResults.length === 0 ? (
              <div className="modal-search-empty">No users found for "{searchQ}"</div>
            ) : (
              searchResults.map((u) => (
                <div
                  className="modal-result-item"
                  key={u._id}
                  onClick={() => addUser(u)}
                >
                  <div className="avatar sm">
                    {u.photoURL ? <img src={u.photoURL} alt={u.name} /> : initials(u.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="search-result-name">{u.name}</div>
                    <div className="search-result-email">{u.email}</div>
                  </div>
                  <span style={{ color: "var(--accent)", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>+</span>
                </div>
              ))
            )}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ marginTop: 20 }}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading
            ? <span className="spinner" style={{ width: 16, height: 16 }} />
            : `Create Group${selectedUsers.length > 0 ? ` (${selectedUsers.length + 1})` : ""}`}
        </button>
      </div>
    </div>
  );
}
