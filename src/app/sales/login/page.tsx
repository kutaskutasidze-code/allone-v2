"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AnimatedLogoHero } from "@/components/shared";
import { AlertCircle, ArrowRight } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  not_sales_user:
    "We couldn't find a sales user for this account. Ask an admin to add you to sales_users, or sign in with a different account.",
};

// Inner client component that reads useSearchParams. Hoisted so the page
// component can wrap it in <Suspense>, which Next.js requires when the
// page is prerendered.
function SalesLoginInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const fromQuery = searchParams.get("error");
    if (fromQuery && ERROR_MESSAGES[fromQuery]) {
      setError(ERROR_MESSAGES[fromQuery]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/sales");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-xl shadow-black/[0.04] border border-[var(--allone-line-soft)] p-10">
          <div className="mb-10">
            <AnimatedLogoHero />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@allonelabs.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] border border-[var(--allone-line)] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:border-gray-400 focus:bg-[var(--bg-surface)] transition-all duration-150 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] border border-[var(--allone-line)] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:border-gray-400 focus:bg-[var(--bg-surface)] transition-all duration-150 text-sm"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-[var(--ink-900)] text-white font-medium rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] active:scale-[0.98] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--ink-400)]">
          Sales team access only. Contact admin for access.
        </p>
      </motion.div>
    </div>
  );
}

export default function SalesLoginPage() {
  return (
    <Suspense fallback={null}>
      <SalesLoginInner />
    </Suspense>
  );
}
