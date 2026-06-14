import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { cn } from "@/utils/cn";
import { initials } from "@/utils/helpers";

const AvatarWithBadge = ({ name = "", src = "", isOnline = false, isGroup = false, size = "size-9", className }) => {
  return (
    <div className="relative shrink-0">
      <Avatar className={cn(size, className)}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback>{isGroup ? "G" : initials(name)}</AvatarFallback>
      </Avatar>
      {isOnline && !isGroup && (
        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background" />
      )}
    </div>
  );
};

export default AvatarWithBadge;
