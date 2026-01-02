"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "../RequireAuth";

type Category = {
  id: number;
  name_ar: string;
  prefix: string;
  next_seq: number;
  is_active: boolean;
};

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [prefix, setPrefix] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: true });

    if (error) return alert(error.message);
    if (data) setRows(data as Category[]);
  }

  async function addCategory() {
    const p = prefix.trim().toUpperCase();
    if (!nameAr.trim() || !p) return alert("اكتب اسم الفئة و Prefix");

    const { error } = await supabase.from("categories").insert({
      name_ar: nameAr.trim(),
      prefix: p,
      next_seq: 1,
      is_active: true,
    });

    if (error) return alert(error.message);

    setNameAr("");
    setPrefix("");
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <RequireAuth>
      <div style={{ padding: 20, direction: "rtl" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>الفئات</h1>

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="اسم الفئة (عربي)"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            placeholder="Prefix مثل TBN"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button
            onClick={addCategory}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #000",
              cursor: "pointer",
            }}
          >
            إضافة
          </button>
        </div>

        <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>#</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>الاسم</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Prefix</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>الترقيم القادم</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>مفعّلة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.id}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.name_ar}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.prefix}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.next_seq}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {r.is_active ? "نعم" : "لا"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: 12, color: "#666" }}>
          افتح الرابط: <b>/categories</b>
        </p>
      </div>
    </RequireAuth>
  );
}
