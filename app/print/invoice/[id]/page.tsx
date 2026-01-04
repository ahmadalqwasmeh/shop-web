"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "../../../RequireAuth";

type Invoice = {
  id: number;
  type: "SALE" | "PURCHASE";
  total: number;
  discount: number;
  notes: string | null;
  created_at: string;
};

type Item = {
  id: number;
  qty: number;
  price: number;
  product: { name_ar: string; sku: string }[]; // Supabase يرجعها Array
};

export default function PrintInvoicePage({ params }: { params: { id?: string } }) {
  // ✅ fallback: لو params.id كان undefined ناخذه من الرابط مباشرة
  const routeParams = useParams<{ id?: string }>();
  const idStr = String(params?.id ?? routeParams?.id ?? "");

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const title = useMemo(() => {
    if (!invoice) return "";
    return invoice.type === "SALE" ? "فاتورة بيع" : "فاتورة شراء";
  }, [invoice]);

  useEffect(() => {
    async function load() {
      const invoiceId = Number.parseInt(idStr, 10);

      if (!Number.isFinite(invoiceId)) {
        alert("رقم الفاتورة غير صحيح: " + idStr);
        return;
      }

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("id, type, total, discount, notes, created_at")
        .eq("id", invoiceId)
        .single();

      if (invErr) return alert(invErr.message);
      setInvoice(inv as Invoice);

      const { data: its, error: itsErr } = await supabase
        .from("invoice_items")
        .select("id, qty, price, product:products(name_ar, sku)")
        .eq("invoice_id", invoiceId);

      if (itsErr) return alert(itsErr.message);
      setItems((its ?? []) as unknown as Item[]);

      setTimeout(() => window.print(), 300);
    }

    load();
  }, [idStr]);

  const subtotal = useMemo(() => {
    return items.reduce((s, it) => s + it.qty * it.price, 0);
  }, [items]);

  if (!invoice) return <div style={{ padding: 20 }}>جاري تحميل الفاتورة...</div>;

  return (
    <RequireAuth>
      <div style={{ padding: 18, fontFamily: "Arial", direction: "rtl" }}>
        {/* رأس الفاتورة */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>إدارة المحل</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              التاريخ: {new Date(invoice.created_at).toLocaleString("ar")}
            </div>
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>رقم الفاتورة</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>#{invoice.id}</div>
          </div>
        </div>

        <hr style={{ margin: "14px 0", border: "none", borderTop: "1px solid #ddd" }} />

        {/* جدول الأصناف */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>الكود</th>
              <th style={th}>الصنف</th>
              <th style={th}>الكمية</th>
              <th style={th}>السعر</th>
              <th style={th}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td style={td}>{it.product?.[0]?.sku ?? "-"}</td>
                <td style={td}>{it.product?.[0]?.name_ar ?? "-"}</td>
                <td style={td}>{it.qty}</td>
                <td style={td}>{Number(it.price).toFixed(3)}</td>
                <td style={td}>{(it.qty * it.price).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ملخص */}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 320 }}>
            <div style={sumRow}>
              <span>المجموع قبل الخصم</span>
              <b>{subtotal.toFixed(3)}</b>
            </div>
            <div style={sumRow}>
              <span>الخصم</span>
              <b>{Number(invoice.discount ?? 0).toFixed(3)}</b>
            </div>
            <div style={{ ...sumRow, fontSize: 16 }}>
              <span>الإجمالي النهائي</span>
              <b>{Number(invoice.total ?? 0).toFixed(3)}</b>
            </div>
          </div>
        </div>

        {/* ملاحظات */}
        {invoice.notes ? (
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
            <b>ملاحظات:</b> {invoice.notes}
          </div>
        ) : null}

        {/* تذييل */}
        <div style={{ marginTop: 20, fontSize: 12, opacity: 0.7, textAlign: "center" }}>
          شكرًا لتعاملكم معنا
        </div>

        {/* إعدادات الطباعة */}
        <style>{`
          @page { size: A4; margin: 12mm; }
          body { background: white; }
        `}</style>
      </div>
    </RequireAuth>
  );
}

const th: React.CSSProperties = {
  borderBottom: "1px solid #ddd",
  padding: 8,
  textAlign: "right",
  fontSize: 12,
  background: "#f3f4f6",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 8,
  textAlign: "right",
  fontSize: 12,
};

const sumRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px dashed #ddd",
};
