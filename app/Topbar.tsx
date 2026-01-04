"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Topbar() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // 1) فحص أولي
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setLoading(false);
    });

    // 2) مراقبة أي تغيير (تسجيل دخول/خروج)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // ✅ لا نعرض الشريط قبل ما نعرف حالة الجلسة
  if (loading) return null;

  // ✅ إذا ما في جلسة => لا تعرض الشريط العلوي
  if (!hasSession) return null;

  return (
    <header className="topbar">
      <div className="brand">إدارة المحل</div>

      <nav className="nav">
        <a className="navLink" href="/categories">الفئات</a>
        <a className="navLink" href="/products">الأصناف</a>
        <a className="navLink" href="/purchase">شراء</a>
        <a className="navLink" href="/sale">بيع</a>
        <a className="navLink" href="/stock">المخزون</a>

        {/* ✅ تغيير النص إلى "تبديل المستخدم" */}
        <a className="navLink" href="/login">تبديل المستخدم</a>

        {/* ✅ زر تسجيل خروج */}
        <button className="navBtn" onClick={logout}>
          تسجيل خروج
        </button>
      </nav>
    </header>
  );
}
