import { cn } from "@/utils/cn";

const Card        = ({ className, ...props }) => <div className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)} {...props} />;
const CardHeader  = ({ className, ...props }) => <div className={cn("px-6", className)} {...props} />;
const CardTitle   = ({ className, ...props }) => <div className={cn("font-semibold leading-none text-lg", className)} {...props} />;
const CardContent = ({ className, ...props }) => <div className={cn("px-6", className)} {...props} />;
const CardFooter  = ({ className, ...props }) => <div className={cn("flex items-center px-6 pt-0", className)} {...props} />;

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
