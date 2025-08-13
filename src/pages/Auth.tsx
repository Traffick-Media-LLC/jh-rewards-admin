import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Lightweight SEO helper (keeps consistency with Shop page)
function useSEO({ title, description, canonical }: { title: string; description: string; canonical?: string }) {
  useEffect(() => {
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical || `${window.location.origin}/auth`;
  }, [title, description, canonical]);
}

const Auth: React.FC = () => {
  useSEO({
    title: "Login | Juice Head Rewards",
    description: "Login or register to access your Juice Head Rewards account and track points.",
    canonical: `${window.location.origin}/auth`,
  });

  const navigate = useNavigate();

  // Critical: maintain both session and user
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loadingLogin, setLoadingLogin] = useState(false);

  // No longer need inline signup form state

  // Establish listener FIRST, then fetch current session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect authenticated users away from auth page
  useEffect(() => {
    if (session?.user) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      toast.success("Logged in successfully");
      // onAuthStateChange will redirect
    } catch (err: any) {
      // Better error handling
      if (err?.message?.includes("Invalid login credentials")) {
        toast.error("Invalid email or password. Please check your credentials and try again.");
      } else if (err?.message?.includes("Email not confirmed")) {
        toast.error("Please check your email and confirm your account before logging in.");
      } else {
        toast.error(err?.message ?? "Login failed");
      }
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast.warning("Enter your email above first");
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      toast.success("Password reset email sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send reset email");
    }
  };

  const handleQuickSignUp = () => {
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            WELCOME TO JUICE HEAD REWARDS
          </h1>
          <p className="mt-2 text-muted-foreground">FLAVORS YOU LOVE, QUALITY YOU TRUST.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start" aria-label="Authentication">
          {/* Login column */}
          <article className="md:col-span-6">
            <h2 className="text-sm font-semibold text-foreground uppercase mb-3">Log In</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(v) => setRememberMe(Boolean(v))} />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground">Remember me</Label>
                </div>
                <button type="button" onClick={handleForgotPassword} className="text-sm text-primary underline-offset-4 hover:underline">
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={loadingLogin}>
                {loadingLogin ? "Logging in..." : "Log In"}
              </Button>
            </form>
          </article>

          {/* Divider on md+ */}
          <div className="hidden md:block md:col-span-1 h-full w-px bg-border mx-auto" aria-hidden="true" />

          {/* Register column */}
          <article className="md:col-span-5 md:pl-6">
            <h2 className="text-sm font-semibold text-foreground uppercase mb-3">New Customer?</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Join Juice Head Rewards to earn points with every purchase and unlock exclusive benefits.
              </p>
              <div className="space-y-3">
                <Button onClick={handleQuickSignUp} className="w-full">
                  Create Account
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Quick setup with full profile completion
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;

