"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "../RequireAuth";

type StockRow = {
  product_id: number;
  name_ar: string;
  sku: string;
  stock_qty: number;
};

export default function StockPage() {
  const [rows, setRows] = useState<StockRow[]>([]);

  async function load() {
    const { data, error } = await supabase
      .from("product_stock")
      .select("*")
      .order("name_ar");

    if (error) {
      alert(error.message);
      return;
    }

    if (data) setRows(data as StockRow[]);
  }

  useEffect(() => {
    load();
  }, []);

  return (
      <RequireAuth>
    <div style={{ padding: 20, direction: "rtl" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>المخزون الحالي</h1>

      <table style={{ width: "100%", marginTop: 16 }}>
        <thead>
          <tr>
            <th>الكود</th>
            <th>الصنف</th>
            <th>الكمية الحالية</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.product_id}>
              <td>{r.sku}</td>
              <td>{r.name_ar}</td>
              <td>{r.stock_qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 12, color: "#666" }}>
        افتح الرابط: <b>/stock</b>
      </p>
        
    </div>
        </RequireAuth>
  );
}



