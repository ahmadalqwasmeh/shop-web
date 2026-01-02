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

    setSelectedProductId("");
    setQty("1");
    setPrice("0");
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty * l.price, 0),
    [lines]
  );

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

    setLines([]);
    setNotes("");
  }

  return (
      <RequireAuth>
    <div style={{ padding: 20, direction: "rtl" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>فاتورة بيع (صادر)</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
          style={{ padding: 10 }}
        >
          <option value="">اختر الصنف</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name_ar} — {p.sku}
            </option>
          ))}
        </select>

        <input
          placeholder="الكمية"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          style={{ padding: 10, width: 120 }}
        />

        <input
          placeholder="سعر البيع"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ padding: 10, width: 140 }}
        />

        <button onClick={addLine} style={{ padding: "10px 14px", cursor: "pointer" }}>
          إضافة للفاتورة
        </button>
          
      </div>
</RequireAuth>
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

      <button
        onClick={saveInvoice}
        style={{ marginTop: 12, padding: "10px 14px", cursor: "pointer" }}
      >
        حفظ الفاتورة + خصم من المخزون
      </button>

      <p style={{ marginTop: 12, color: "#666" }}>
        افتح الرابط: <b>/sale</b>
      </p>
    </div>
  );
}



