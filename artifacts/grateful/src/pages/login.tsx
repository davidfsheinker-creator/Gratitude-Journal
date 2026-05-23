import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";

export function Login() {
  const { login, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const redirectTo = new URLSearchParams(location.split("?")[1] ?? "").get("redirect") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      queryClient.clear();
      navigate(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-2">Grateful</h1>
          <p className="text-muted-foreground text-sm">Your mindful daily journal</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-6 flex flex-col gap-5">
          <h2 className="font-serif text-xl text-foreground">Welcome back</h2>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity mt-1"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Your journal is private and belongs to you.
        </p>
      </motion.div>
    </div>
  );
}
