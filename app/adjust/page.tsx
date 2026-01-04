"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "../RequireAuth";

type Product = { id: number; name_ar: string; sku: string };

export default function AdjustPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name_ar, sku")
      .eq("is_active", true)
      .order("id", { ascending: false });

    if (error) return alert(error.message);
    setProducts((data ?? []) as Product[]);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products
      .filter((p) => p.name_ar.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, query]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function addAdjustment(type: "IN" | "OUT") {
    if (selectedId === "") return alert("اختر صنف");
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) return alert("الكمية لازم تكون رقم أكبر من 0");

    const { error } = await supabase.from("stock_movements").insert({
      product_id: selectedId,
      movement_type: type, // IN / OUT
      qty: q,
      ref_type: "adjust",
      ref_id: null,
      notes: reason || null,
    });

    if (error) return alert(error.message);

    alert("تم تعديل الكمية ✅");
    setSelectedId("");
    setQuery("");
    setQty("1");
    setReason("");
  }

  return (
    <RequireAuth>
      <div style={{ padding: 20, direction: "rtl" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>تعديل كمية (جرد / تسوية)</h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          <div style={{ position: "relative", minWidth: 320, flexGrow: 1 }}>
            <input
              placeholder="ابحث بالاسم أو SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: "100%" }}
            />

            <div
              style={{
                position: "absolute",
                top: "44px",
                right: 0,
                left: 0,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                maxHeight: 260,
                overflowY: "auto",
                boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
                display: query ? "block" : "none",
                zIndex: 20,
              }}
            >
              {filtered.length === 0 ? (
                <div style={{ padding: 10, color: "#6b7280" }}>لا يوجد نتائج</div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(p.id);
                      setQuery(`${p.name_ar} — ${p.sku}`);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "right",
                      border: "none",
                      borderBottom: "1px solid #f1f5f9",
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 10,
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  >
                    {p.name_ar} — <span style={{ opacity: 0.7 }}>{p.sku}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <input
            placeholder="الكمية"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            style={{ width: 140 }}
          />

          <button onClick={() => addAdjustment("IN")}>زيادة كمية</button>
          <button onClick={() => addAdjustment("OUT")}>إنقاص كمية</button>
        </div>

        <textarea
          placeholder="سبب التعديل (اختياري)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ width: "100%", marginTop: 12, padding: 10, minHeight: 60 }}
        />

        <p style={{ marginTop: 12, color: "#666" }}>
          افتح الرابط: <b>/adjust</b>
        </p>
      </div>
    </RequireAuth>
  );
}
