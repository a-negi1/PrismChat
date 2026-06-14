import { useState, useRef } from "react";
import {
  auth, provider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "@/services/firebase";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/cn";
import Watermark from "@/components/ui/Watermark";


const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const FRIENDLY_ERRORS = {
  "auth/user-not-found":        "No account found with that email.",
  "auth/wrong-password":        "Incorrect password. Please try again.",
  "auth/invalid-credential":    "Incorrect email or password.",
  "auth/email-already-in-use":  "An account with this email already exists.",
  "auth/weak-password":         "Password must be at least 6 characters.",
  "auth/invalid-email":         "Please enter a valid email address.",
  "auth/too-many-requests":     "Too many attempts. Please wait and try again.",
  "auth/network-request-failed":"Network error. Check your connection.",
  "auth/popup-blocked":         "Popup blocked. Allow popups for this site.",
};
const friendlyError = (e) => FRIENDLY_ERRORS[e.code] || e.message || "Something went wrong.";


export default function AuthScreen({ onLogin }) {
  const [mode,        setMode]        = useState("login");   // login | signup | forgot
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [avatarFile,  setAvatarFile]  = useState(null);
  const [avatarPrev,  setAvatarPrev]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [gLoading,    setGLoading]    = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const fileRef = useRef();

  const reset = (next) => { setMode(next); setError(""); setSuccess(""); setPassword(""); setConfirm(""); };

  const exchangeToken = async (firebaseUser, forceName = null) => {
    const idToken  = await firebaseUser.getIdToken(true);
    const userData = await api.verifyFirebaseToken(idToken, forceName);
    if (userData.error) throw new Error(userData.error);
    return userData;
  };

  const handleGoogle = async () => {
    setError(""); setGLoading(true);
    try {
      const result   = await signInWithPopup(auth, provider);
      const userData = await exchangeToken(result.user);
      onLogin(userData);
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") setError(friendlyError(e));
    }
    setGLoading(false);
  };

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!email || !password) return setError("Please fill in all fields.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Invalid email address.");
    if (mode === "signup") {
      if (!name.trim())          return setError("Please enter your name.");
      if (password.length < 6)   return setError("Password must be at least 6 characters.");
      if (password !== confirm)   return setError("Passwords do not match.");
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        if (avatarFile) {
          const upload = await api.uploadFile(avatarFile);
          await updateProfile(cred.user, { photoURL: upload.secure_url });
        }
        const userData = await exchangeToken(cred.user, name.trim());
        onLogin(userData);
      } else {
        const cred     = await signInWithEmailAndPassword(auth, email, password);
        const userData = await exchangeToken(cred.user);
        onLogin(userData);
      }
    } catch (e) { setError(friendlyError(e)); }
    setLoading(false);
  };

  const handleForgot = async () => {
    setError(""); setSuccess("");
    if (!email) return setError("Please enter your email.");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (e) { setError(friendlyError(e)); }
    setLoading(false);
  };

  const handleAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPrev(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-muted/40 p-4 gap-6">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex flex-col items-center gap-3 pt-8 pb-6 px-6 border-b border-border">
            <div className="size-11 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-xl">P</span>
            </div>
            <div className="text-center">
              <h1 className="font-semibold text-xl">
                {mode === "login"  ? "Welcome back"
                : mode === "signup" ? "Create account"
                :                    "Reset password"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login"  ? "Sign in to continue to Prism Chat"
                : mode === "signup" ? "Join and start chatting in real-time"
                :                    "Enter your email and we'll send a reset link"}
              </p>
            </div>
          </div>

          <div className="px-6 py-6 flex flex-col gap-4">
            {error   && <div className="px-3 py-2.5 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">⚠ {error}</div>}
            {success && <div className="px-3 py-2.5 bg-green-500/10 text-green-600 dark:text-green-400 text-sm rounded-lg border border-green-500/20">✓ {success}</div>}

            
            {mode !== "forgot" && (
              <>
                <Button
                  variant="outline"
                  className="w-full gap-2.5 h-10"
                  onClick={handleGoogle}
                  disabled={gLoading || loading}
                >
                  {gLoading ? <Spinner className="size-4" /> : <GoogleIcon />}
                  Continue with Google
                </Button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </>
            )}

            
            {mode === "signup" && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="size-14 rounded-full bg-muted border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center overflow-hidden transition-colors shrink-0"
                >
                  {avatarPrev
                    ? <img src={avatarPrev} alt="avatar" className="size-full object-cover" />
                    : <span className="text-xl">👤</span>
                  }
                </button>
                <div>
                  <p className="text-xs font-medium">Profile photo</p>
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-primary hover:underline">
                    Upload image (optional)
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </div>
            )}

            
            {mode === "signup" && (
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            )}

            
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (mode === "forgot" ? handleForgot() : handleSubmit())}
              />
            </div>

            
            {mode !== "forgot" && (
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  {mode === "login" && (
                    <button type="button" onClick={() => reset("forgot")} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            )}

            
            {mode === "signup" && (
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            )}

            
            <Button
              className="w-full h-10 mt-1"
              onClick={mode === "forgot" ? handleForgot : handleSubmit}
              disabled={loading || gLoading}
            >
              {loading && <Spinner className="size-4" />}
              {mode === "login"  ? "Sign In"
              : mode === "signup" ? "Create Account"
              :                    "Send Reset Email"}
            </Button>

            
            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" && (
                <>Don't have an account?{" "}
                  <button onClick={() => reset("signup")} className="text-primary font-medium hover:underline">Sign Up</button>
                </>
              )}
              {mode === "signup" && (
                <>Already have an account?{" "}
                  <button onClick={() => reset("login")} className="text-primary font-medium hover:underline">Sign In</button>
                </>
              )}
              {mode === "forgot" && (
                <>Remember it?{" "}
                  <button onClick={() => reset("login")} className="text-primary font-medium hover:underline">Sign In</button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
      <Watermark />
    </div>
  );
}
