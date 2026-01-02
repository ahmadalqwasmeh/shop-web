"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "../RequireAuth";

type Product = {
  id: number;
  name_ar: string;
  sku: string;
  sale_price: number;
};

type Line = {
  product_id: number;
  sku: string;
  name_ar: string;
  qty: number;
  price: number; // سعر البيع
};

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [qty, setQty] = useState<string>("1");
  const [price, setPrice] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");

  // ✅ البحث
  const [query, setQuery] = useState("");

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name_ar, sku, sale_price")
      .eq("is_active", true)
      .order("id", { ascending: false });

    if (error) return alert(error.message);
    setProducts((data ?? []) as Product[]);
  }

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // ✅ فلترة حسب البحث (اسم أو SKU)
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 20);

    return products
      .filter((p) => p.name_ar.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, query]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // لما تختار منتج، عبّي سعر البيع تلقائيًا
    if (selectedProduct) setPrice(String(selectedProduct.sale_price ?? 0));
  }, [selectedProduct]);

  function addLine() {
    if (!selectedProduct) return alert("اختر صنف");
    const q = Number(qty);
    const pr = Number(price);
    if (!Number.isFinite(q) || q <= 0) return alert("الكمية لازم تكون رقم أكبر من 0");
    if (!Number.isFinite(pr) || pr < 0) return alert("السعر غير صحيح");

    setLines((prev) => [
      ...prev,
      {
        product_id: selectedProduct.id,
        sku: selectedProduct.sku,
        name_ar: selectedProduct.name_ar,
        qty: q,
        price: pr,
      },
    ]);

    // reset الإدخال
    setSelectedProductId("");
    setQuery("");
    setQty("1");
    setPrice("0");
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const total = useMemo(() => lines.reduce((sum, l) => sum + l.qty * l.price, 0), [lines]);

  async function saveInvoice() {
    if (lines.length === 0) return alert("أضف أصناف للفاتورة أولًا");

    // 1) أنشئ الفاتورة (SALE)
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        type: "SALE",
        discount: 0,
        total,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (invErr) return alert(invErr.message);

    const invoiceId = inv.id;

    // 2) أضف بنود الفاتورة
    const itemsPayload = lines.map((l) => ({
      invoice_id: invoiceId,
      product_id: l.product_id,
      qty: l.qty,
      price: l.price,
    }));

    const { error: itemsErr } = await supabase.from("invoice_items").insert(itemsPayload);
    if (itemsErr) return alert(itemsErr.message);

    // 3) أضف حركات مخزون OUT
    const movesPayload = lines.map((l) => ({
      product_id: l.product_id,
      movement_type: "OUT",
      qty: l.qty,
      ref_type: "invoice",
      ref_id: invoiceId,
    }));

    const { error: moveErr } = await supabase.from("stock_movements").insert(movesPayload);
    if (moveErr) return alert(moveErr.message);

    alert("تم حفظ فاتورة البيع رقم: " + invoiceId);

    // Reset
    setLines([]);
    setNotes("");
    setSelectedProductId("");
    setQuery("");
    setQty("1");
    setPrice("0");
  }

  return (
    <RequireAuth>
      <div style={{ padding: 20, direction: "rtl" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>فاتورة بيع (صادر)</h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          {/* ✅ بحث واختيار صنف */}
          <div style={{ position: "relative", minWidth: 320, flexGrow: 1 }}>
            <input
              placeholder="ابحث بالاسم أو الكود (SKU)..."
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
              {filteredProducts.length === 0 ? (
                <div style={{ padding: 10, color: "#6b7280" }}>لا يوجد نتائج</div>
              ) : (
                filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(p.id);
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
            style={{ width: 120 }}
          />

          <input
            placeholder="سعر البيع"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: 140 }}
          />

          <button onClick={addLine} style={{ cursor: "pointer" }}>
            إضافة للفاتورة
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <textarea
            placeholder="ملاحظات (اختياري)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", padding: 10, minHeight: 60 }}
          />
        </div>

        <table style={{ width: "100%", marginTop: 16 }}>
          <thead>
            <tr>
              <th>الكود</th>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <tr key={idx}>
                <td>{l.sku}</td>
                <td>{l.name_ar}</td>
                <td>{l.qty}</td>
                <td>{l.price}</td>
                <td>{(l.qty * l.price).toFixed(3)}</td>
                <td>
                  <button onClick={() => removeLine(idx)} style={{ cursor: "pointer" }}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12, fontWeight: "bold" }}>
          المجموع: {total.toFixed(3)}
        </div>

        <button onClick={saveInvoice} style={{ marginTop: 12, cursor: "pointer" }}>
          حفظ الفاتورة + خصم من المخزون
        </button>

        <p style={{ marginTop: 12, color: "#666" }}>
          افتح الرابط: <b>/sale</b>
        </p>
      </div>
    </RequireAuth>
  );
}
