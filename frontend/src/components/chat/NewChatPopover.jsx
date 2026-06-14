import { memo, useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import AvatarWithBadge from "@/components/AvatarWithBadge";
import { PenBox, ArrowLeft, Users, Search } from "lucide-react";
import { cn } from "@/utils/cn";



const UserRow = memo(({ user, right, disabled, onClick }) => (
  <button
    disabled={disabled}
    onClick={() => onClick(user)}
    className={cn(
      "w-full flex items-center gap-2.5 px-2 py-2 rounded-md",
      "hover:bg-accent transition-colors text-left",
      "disabled:opacity-50 disabled:pointer-events-none"
    )}
  >
    <AvatarWithBadge name={user.name} src={user.photoURL || ""} />
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium truncate">{user.name}</p>
      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
    </div>
    {right}
  </button>
));
UserRow.displayName = "UserRow";

const NewGroupButton = memo(({ disabled, onClick }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
  >
    <div className="bg-primary/10 p-2 rounded-full shrink-0">
      <Users className="size-4 text-primary" />
    </div>
    <span className="text-[13px] font-medium">New Group</span>
  </button>
));
NewGroupButton.displayName = "NewGroupButton";



export const NewChatPopover = memo(({ currentUser, onChatStarted, onGroupCreated }) => {
  const [open,          setOpen]          = useState(false);
  const [isGroupMode,   setIsGroupMode]   = useState(false);
  const [groupName,     setGroupName]     = useState("");
  const [searchQ,       setSearchQ]       = useState("");
  const [users,         setUsers]         = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating,      setCreating]      = useState(false);
  const [loadingUserId, setLoadingUserId] = useState(null);

  
  useEffect(() => {
    if (!searchQ.trim()) { setUsers([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const data = await api.searchUsers(searchQ);
      const selectedIds = selectedMembers.map((u) => u._id);
      setUsers((data || []).filter((u) => u._id !== currentUser._id && !selectedIds.includes(u._id)));
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, currentUser._id, selectedMembers]);

  const reset = useCallback(() => {
    setIsGroupMode(false);
    setGroupName("");
    setSearchQ("");
    setUsers([]);
    setSelectedMembers([]);
  }, []);

  const handleOpenChange = (val) => {
    setOpen(val);
    if (!val) reset();
  };

  const toggleSelect = (user) =>
    setSelectedMembers((p) =>
      p.find((u) => u._id === user._id)
        ? p.filter((u) => u._id !== user._id)
        : [...p, user]
    );

  const startDM = async (user) => {
    setLoadingUserId(user._id);
    onChatStarted(user);
    setOpen(false);
    reset();
    setLoadingUserId(null);
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    setCreating(true);
    try {
      const group = await api.createGroup(
        groupName.trim(),
        currentUser._id,
        selectedMembers.map((u) => u._id)
      );
      if (!group.error) {
        onGroupCreated(group);
        setOpen(false);
        reset();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <PenBox className="size-5 stroke-[1.5]" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-80 p-0 rounded-xl min-h-[420px] max-h-[80vh] flex flex-col overflow-hidden z-[200]"
      >
        
        <div className="border-b px-3 py-3 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {isGroupMode && (
              <Button variant="ghost" size="icon" className="size-7" onClick={() => { setIsGroupMode(false); setSelectedMembers([]); }}>
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <h3 className="font-semibold text-base">
              {isGroupMode ? "New Group" : "New Chat"}
            </h3>
          </div>

         
          {isGroupMode ? (
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Group name…"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground z-10" />
                <Input
                  placeholder="Search members to add…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="h-8 text-sm pl-8 bg-background"
                />
                {searching && (
                  <Spinner className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5" />
                )}
              </div>
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMembers.map((u) => (
                    <span
                      key={u._id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      {u.name}
                      <button
                        type="button"
                        onClick={() => toggleSelect(u)}
                        className="hover:opacity-70 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name or email…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-8 text-sm pl-8"
                autoFocus
              />
              {searching && (
                <Spinner className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5" />
              )}
            </div>
          )}
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
          {!isGroupMode && (
            <NewGroupButton disabled={creating} onClick={() => setIsGroupMode(true)} />
          )}

          {users.length === 0 && searchQ.trim() && !searching && (
            <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
          )}

          {users.length === 0 && !searchQ.trim() && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {isGroupMode ? "Search for members to add" : "Search to start a conversation"}
            </p>
          )}

          {!isGroupMode && users.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              disabled={loadingUserId !== null}
              onClick={startDM}
              right={loadingUserId === u._id && <Spinner className="size-3.5 ml-auto" />}
            />
          ))}

          {isGroupMode && users.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              disabled={false}
              onClick={() => toggleSelect(u)}
              right={
                <Checkbox
                  checked={selectedMembers.some((m) => m._id === u._id)}
                  onCheckedChange={() => toggleSelect(u)}
                  className="pointer-events-none"
                />
              }
            />
          ))}
        </div>

        
        {isGroupMode && (
          <div className="border-t px-3 py-3 shrink-0">
            {selectedMembers.length > 0 && (
              <p className="text-xs text-muted-foreground mb-2">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} selected
              </p>
            )}
            <Button
              className="w-full"
              onClick={createGroup}
              disabled={creating || !groupName.trim() || selectedMembers.length === 0}
            >
              {creating && <Spinner className="size-4" />}
              Create Group
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});
NewChatPopover.displayName = "NewChatPopover";

export default NewChatPopover;
