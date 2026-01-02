"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return alert(error.message);
    window.location.href = "/categories";
  }

  return (
    <div style={{ padding: 20, direction: "rtl", maxWidth: 420, margin: "40px auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>تسجيل الدخول</h1>

      <input
        placeholder="الإيميل"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginTop: 12 }}
      />

      <input
        placeholder="كلمة المرور"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <button
        onClick={login}
        style={{ width: "100%", padding: 12, marginTop: 12, cursor: "pointer" }}
      >
        دخول
      </button>
    </div>
  );
}
