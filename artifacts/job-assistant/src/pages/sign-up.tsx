import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data.session) {
      setLocation("/dashboard");
    } else {
      setVerifyMsg("Account created! You can sign in now.");
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-sm text-white/45 mt-1">Start scouting smarter today</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          {verifyMsg ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="text-sm text-white/70">{verifyMsg}</p>
              <Link href="/sign-in">
                <Button className="btn-gradient w-full">Sign in now</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/60 text-xs uppercase tracking-wide">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-white/5 border-white/12 text-white placeholder:text-white/25 focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/60 text-xs uppercase tracking-wide">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="bg-white/5 border-white/12 text-white placeholder:text-white/25 focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-white/60 text-xs uppercase tracking-wide">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-white/5 border-white/12 text-white placeholder:text-white/25 focus:border-blue-500/50"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full btn-gradient" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </form>
          )}

          {!verifyMsg && (
            <p className="text-center text-sm text-white/40">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-blue-400 font-medium hover:text-blue-300 hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
