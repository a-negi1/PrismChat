import "./styles/globals.css";
import { useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme.jsx";
import AuthScreen from "./components/auth/AuthScreen";
import ChatApp from "./components/chat/ChatApp";
import { Spinner } from "./components/ui/spinner";

function AppContent() {
  const { user, login, logout, updateUser } = useAuth();

  
  if (user === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <div className="size-12 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl">P</span>
        </div>
        <Spinner className="size-6" />
      </div>
    );
  }

  return user
    ? <ChatApp currentUser={user} onSignOut={logout} onUserUpdate={updateUser} />
    : <AuthScreen onLogin={login} />;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="prism-theme">
      <AppContent />
    </ThemeProvider>
  );
}
