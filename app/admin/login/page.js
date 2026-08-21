"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("لطفاً نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      console.log("LOGIN RESULT:", result);

      if (!response.ok || !result.success) {
        setError(
          result.error || "نام کاربری یا رمز عبور اشتباه است."
        );
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setError("خطا در اتصال به سرور.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-100 px-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">
            🔐
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            ورود به پنل مدیریت
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            سیستم حقوق و دستمزد
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <div>
            <label className="mb-2 block font-bold text-slate-700">
              نام کاربری
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="admin"
              autoComplete="username"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold text-slate-700">
              رمز عبور
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="رمز عبور"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading
              ? "در حال ورود..."
              : "ورود به پنل"}
          </button>

        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          سیستم حقوق و دستمزد
        </div>

      </div>
    </main>
  );
}