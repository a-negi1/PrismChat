import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AvatarWithBadge from "@/components/AvatarWithBadge";
import { useTheme } from "@/hooks/useTheme.jsx";

const AsideBar = ({ user, onSignOut, onChangePhoto, onChangeName }) => {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="fixed inset-y-0 left-0 w-11 z-[9999] h-svh bg-primary shadow-sm flex flex-col items-center justify-between py-2 px-1">
      
      <img src="/logo.png" alt="Logo" className="size-8 object-cover rounded-lg" />

      <div className="flex flex-col items-center gap-3">
        
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-white hover:bg-white/20 border-0"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun  className="h-4 w-4 rotate-0  scale-100 transition-all dark:scale-0  dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0  transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full">
              <AvatarWithBadge
                name={user?.name || "?"}
                src={user?.photoURL || ""}
                isOnline={true}
                className="!bg-white/20 ring-2 ring-white/30 cursor-pointer"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 z-[99999]" side="right" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm truncate">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onChangePhoto} className="cursor-pointer">
              Change photo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onChangeName} className="cursor-pointer">
              Change name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-destructive focus:text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default AsideBar;
