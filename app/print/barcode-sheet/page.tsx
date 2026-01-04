"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "../RequireAuth";

type Product = {
  id: number;
  name_ar: string;
  sku: string;
};

export default function BarcodeSheetPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [copies, setCopies] = useState("24"); // عدد الملصقات
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name_ar, sku")
      .eq("is_active", true)
      .order("id", { ascending: false });

    if (error) return alert(error.message);
    setProducts((data ?? []) as Product[]);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter((p) => p.name_ar.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, query]);

  function loadJsBarcode(): Promise<void> {
    return new Promise((resolve) => {
      // إذا موجود مسبقًا لا تعيد تحميله
      // @ts-ignore
      if (window.JsBarcode) return resolve();

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  async function generateAndPrint() {
    if (!selected) return alert("اختر صنف أولاً");
    const n = Number(copies);
    if (!Number.isFinite(n) || n <= 0) return alert("عدد الملصقات غير صحيح");

    await loadJsBarcode();

    // ضع الملصقات
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < n; i++) {
      const label = document.createElement("div");
      label.className = "label";

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "barcode");

      const code = document.createElement("div");
      code.className = "code";
      code.textContent = selected.sku;

      label.appendChild(svg);
      label.appendChild(code);

      container.appendChild(label);

      // @ts-ignore
      window.JsBarcode(svg, selected.sku, {
        format: "CODE128",
        displayValue: false, // صغير بدون رقم داخل الباركود
        height: 34,
        margin: 0,
      });
    }

    setTimeout(() => window.print(), 250);
  }

  return (
    <RequireAuth>
      <div style={{ padding: 20, direction: "rtl" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>طباعة ملصقات باركود (صغير)</h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
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
                top: 44,
                right: 0,
                left: 0,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                maxHeight: 260,
                overflowY: "auto",
                boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
                display: query ? "block" : "none",
                zIndex: 30,
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
                      setSelected(p);
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
            placeholder="عدد الملصقات"
            value={copies}
            onChange={(e) => setCopies(e.target.value)}
            style={{ width: 160 }}
          />

          <button onClick={generateAndPrint}>تجهيز + طباعة</button>
        </div>

        {selected ? (
          <div style={{ marginTop: 10, color: "#6b7280" }}>
            الصنف المختار: <b>{selected.name_ar}</b> — <b>{selected.sku}</b>
          </div>
        ) : null}

        {/* منطقة الطباعة */}
        <div className="sheet" ref={containerRef} />

        <style>{`
          /* هذه المنطقة لا تظهر جميلة على الشاشة، لكنها مخصصة للطباعة */
          .sheet{
            margin-top: 18px;
            display: grid;
            grid-template-columns: repeat(4, 1fr); /* 4 أعمدة */
            gap: 8px;
          }

          .label{
            width: 48mm;     /* عرض الملصق */
            height: 22mm;    /* ارتفاع الملصق */
            border: 1px dashed #ddd;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2mm;
          }

          .barcode{
            width: 100%;
            height: 12mm;
          }

          .code{
            margin-top: 2mm;
            font-size: 9pt;
            font-family: Arial;
            direction: ltr;
          }

          @media print {
            body { background: white; }
            /* نخفي كل شيء ما عدا ورقة الملصقات */
            h1, input, button, .topbar, .container > div:not(.sheet) { display:none !important; }
            .sheet { margin: 0; gap: 6mm; }
            .label { border: none; }
          }

          @page{
            size: A4;
            margin: 10mm;
          }
        `}</style>
      </div>
    </RequireAuth>
  );
}
