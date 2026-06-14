import { useState } from "react";
import { X, Pencil, Check, Camera, UserPlus, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import AvatarWithBadge from "@/components/AvatarWithBadge";
import { cn } from "@/utils/cn";
import { api } from "@/services/api";
import { isGroupChat, initials } from "@/utils/helpers";

const ProfilePanel = ({ activeChat, sharedMedia, onImageClick, currentUser, onGroupUpdated, onLeaveGroup, onClose }) => {
  const isGroup = isGroupChat(activeChat);
  const isAdmin = isGroup && activeChat.admin?.toString() === currentUser._id;

  const [renaming,    setRenaming]    = useState(false);
  const [newName,     setNewName]     = useState(activeChat.name);
  const [addQuery,    setAddQuery]    = useState("");
  const [addResults,  setAddResults]  = useState([]);
  const [addSearching,setAddSearching]= useState(false);
  const [busy,        setBusy]        = useState(false);
  const [err,         setErr]         = useState("");

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === activeChat.name) { setRenaming(false); return; }
    setBusy(true); setErr("");
    try {
      const updated = await api.renameGroup(activeChat._id, newName.trim(), currentUser._id);
      if (updated.error) throw new Error(updated.error);
      onGroupUpdated(updated);
    } catch (e) { setErr(e.message); }
    setBusy(false); setRenaming(false);
  };

  const handleAddSearch = async (q) => {
    setAddQuery(q);
    if (!q.trim()) { setAddResults([]); return; }
    setAddSearching(true);
    const data = await api.searchUsers(q);
    const memberIds = activeChat.members.map((m) => m._id || m);
    setAddResults(data.filter((u) => !memberIds.includes(u._id) && u._id !== currentUser._id));
    setAddSearching(false);
  };

  const handleAddMember = async (user) => {
    setBusy(true); setErr("");
    try {
      const updated = await api.addGroupMember(activeChat._id, user._id, currentUser._id);
      if (updated.error) throw new Error(updated.error);
      onGroupUpdated(updated);
      setAddQuery(""); setAddResults([]);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${activeChat.name}"?`)) return;
    setBusy(true); setErr("");
    try {
      const result = await api.leaveGroup(activeChat._id, currentUser._id);
      if (result.error) throw new Error(result.error);
      onLeaveGroup(activeChat._id, result.deleted ? null : result);
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const handleGroupPhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setBusy(true); setErr("");
    try {
      const upload  = await api.uploadFile(file);
      if (upload.error) throw new Error(upload.error);
      const updated = await api.updateGroupPhoto(activeChat._id, upload.secure_url, currentUser._id);
      if (updated.error) throw new Error(updated.error);
      onGroupUpdated(updated);
    } catch (e) { setErr(e.message); }
    setBusy(false); e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full border-l border-border bg-card w-72 shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm">Info</h3>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {err && (
        <div className="mx-4 mt-3 px-3 py-2 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20">
          {err}
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-2 pt-6 pb-4 px-4">
        <div className="relative group">
          <AvatarWithBadge
            name={activeChat.name}
            src={activeChat.photoURL || ""}
            isOnline={!isGroup && activeChat.online}
            isGroup={isGroup}
            size="size-20"
            className="text-2xl"
          />
          {isGroup && isAdmin && (
            <label className={cn(
              "absolute inset-0 rounded-full flex items-center justify-center",
              "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            )}>
              <Camera className="size-5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleGroupPhoto} />
            </label>
          )}
        </div>

        {isGroup && isAdmin && renaming ? (
          <div className="flex items-center gap-1.5 w-full max-w-[200px]">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
              className="h-7 text-sm text-center"
              autoFocus
            />
            <Button size="icon" className="size-7" onClick={handleRename} disabled={busy}>
              <Check className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-base">{activeChat.name}</p>
            {isGroup && isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => { setNewName(activeChat.name); setRenaming(true); }}
              >
                <Pencil className="size-3" />
              </Button>
            )}
          </div>
        )}

        {isGroup ? (
          <p className="text-xs text-muted-foreground">
            {activeChat.members?.length || 0} members{isAdmin && " · Admin"}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{activeChat.email}</p>
        )}
      </div>

      
      {isGroup && (
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Members</p>
          <div className="space-y-1">
            {(activeChat.members || []).map((member) => {
              const id       = member._id || member;
              const mName    = member.name  || id;
              const mAdmin   = activeChat.admin?.toString() === id;
              return (
                <div key={id} className="flex items-center gap-2 py-1">
                  <AvatarWithBadge name={mName} src={member.photoURL || ""} size="size-7" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{id === currentUser._id ? "You" : mName}</p>
                  </div>
                  {mAdmin && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      
      {sharedMedia.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Shared Media ({sharedMedia.length})
          </p>
          <div className="grid grid-cols-3 gap-1">
            {sharedMedia.slice(0, 9).map((url, i) => (
              <button
                key={i}
                onClick={() => onImageClick(url)}
                className="aspect-square rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      
      {isGroup && (
        <div className="px-4 pb-6 mt-auto">
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
            onClick={handleLeave}
            disabled={busy}
          >
            {busy ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
            Leave Group
          </Button>
        </div>
      )}
      </div>

      {/* Add member — pinned below scroll area so dropdown is never clipped */}
      {isGroup && isAdmin && (
        <div className="shrink-0 border-t border-border px-4 py-3 bg-card relative z-20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Add Member</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search users…"
              value={addQuery}
              onChange={(e) => handleAddSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
            {addSearching && <Spinner className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5" />}
          </div>
          {addQuery.trim() && addResults.length === 0 && !addSearching && (
            <p className="text-xs text-muted-foreground mt-2 px-1">No users found</p>
          )}
          {addResults.length > 0 && (
            <div className="mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-40 overflow-y-auto">
              {addResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => !busy && handleAddMember(u)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-accent transition-colors text-left"
                >
                  <AvatarWithBadge name={u.name} src={u.photoURL || ""} size="size-6" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <UserPlus className="size-3.5 text-primary shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePanel;
