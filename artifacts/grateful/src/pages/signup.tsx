import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { TraditionPicker } from "@/components/tradition-picker";
import { useUpdateSettings } from "@workspace/api-client-react";
import { ChevronRight, ArrowLeft } from "lucide-react";

type Step = "account" | "tradition";

export function Signup() {
  const { signup, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const updateSettings = useUpdateSettings();

  const [step, setStep] = useState<Step>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tradition, setTradition] = useState("No Preference");
  const [error, setError] = useState("");

  const redirectTo = new URLSearchParams(location.split("?")[1] ?? "").get("redirect") ?? "/";

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setStep("tradition");
  }

  async function handleFinish() {
    setError("");
    try {
      await signup(email, password);
      queryClient.clear();
      if (tradition !== "No Preference") {
        try { await updateSettings.mutateAsync({ data: { tradition } }); } catch { }
      }
      navigate(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setStep("account");
    }
  }

  function handleSkip() {
    handleFinish();
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8">
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

        <AnimatePresence mode="wait">
          {step === "account" ? (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-card border border-border/60 p-6 flex flex-col gap-5">
                <div>
                  <h2 className="font-serif text-xl text-foreground">Begin your practice</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">Your journal starts fresh — just for you.</p>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAccountSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Email</label>
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
                    <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Confirm password</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity mt-1"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tradition"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-card border border-border/60 p-6 flex flex-col gap-5">
                <div>
                  <button
                    onClick={() => setStep("account")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <h2 className="font-serif text-xl text-foreground">What tradition resonates with you?</h2>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    We'll personalize your experience with quotes from your chosen path.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto pr-0.5">
                  <TraditionPicker value={tradition} onChange={setTradition} />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleFinish}
                    disabled={isLoading || updateSettings.isPending}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isLoading || updateSettings.isPending ? "Creating account..." : "Start journaling"}
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={isLoading}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Your gratitude practice, private and yours alone.
        </p>
      </motion.div>
    </div>
  );
}
