"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
  product: { name_ar: string; sku: string }[];
};

export default function PrintInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const title = useMemo(() => {
    if (!invoice) return "";
    return invoice.type === "SALE" ? "فاتورة بيع" : "فاتورة شراء";
  }, [invoice]);

  useEffect(() => {
    async function load() {
      const invoiceId = Number(params.id);
      if (!Number.isFinite(invoiceId)) {
        alert("رقم الفاتورة غير صحيح");
        return;
      }

      const { data: inv } = await supabase
        .from("invoices")
        .select("id, type, total, discount, notes, created_at")
        .eq("id", invoiceId)
        .single();

      if (!inv) return alert("الفاتورة غير موجودة");
      setInvoice(inv);

      // اسم ملف PDF
      document.title = `فاتورة-${inv.id}`;

      const { data: its } = await supabase
        .from("invoice_items")
        .select("id, qty, price, product:products(name_ar, sku)")
        .eq("invoice_id", invoiceId);

      setItems((its ?? []) as Item[]);

      setTimeout(() => window.print(), 300);
    }

    load();
  }, [params.id]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.qty * it.price, 0),
    [items]
  );

  if (!invoice) return <div style={{ padding: 20 }}>جاري التحميل...</div>;

  return (
    <div style={{ padding: 18, fontFamily: "Arial", direction: "rtl" }}>
      {/* رأس */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>فاتورة</div>
          <div style={{ marginTop: 6 }}>{title}</div>
          <div style={{ fontSize: 12 }}>
            التاريخ: {new Date(invoice.created_at).toLocaleString("ar")}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700 }}>رقم الفاتورة</div>
          <div style={{ fontSize: 20 }}>#{invoice.id}</div>
        </div>
      </div>

      <hr />

      {/* جدول */}
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
              <td style={td}>{it.product?.[0]?.sku}</td>
              <td style={td}>{it.product?.[0]?.name_ar}</td>
              <td style={td}>{it.qty}</td>
              <td style={td}>{it.price.toFixed(3)}</td>
              <td style={td}>{(it.qty * it.price).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ملخص */}
      <div style={{ marginTop: 12 }}>
        <div>المجموع: {subtotal.toFixed(3)}</div>
        <div>الخصم: {invoice.discount.toFixed(3)}</div>
        <b>الإجمالي: {invoice.total.toFixed(3)}</b>
      </div>

      {invoice.notes && (
        <div style={{ marginTop: 10 }}>
          <b>ملاحظات:</b> {invoice.notes}
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 12 }}>
        شكرًا لتعاملكم معنا
      </div>

      {/* CSS الطباعة */}
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          body {
            margin: 0;
          }

          header, footer, nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const th: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  padding: 6,
  fontSize: 12,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 6,
  fontSize: 12,
};
