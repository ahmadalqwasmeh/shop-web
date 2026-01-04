"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: number;
  name_ar: string;
  sku: string;
};

export default function PrintBarcodePage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("products")
        .select("id, name_ar, sku")
        .eq("id", Number(params.id))
        .single();

      if (error) {
        alert(error.message);
        return;
      }
      setProduct(data as Product);
    }
    load();
  }, [params.id]);

  useEffect(() => {
    if (!product || !svgRef.current) return;

    // تحميل JsBarcode من CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
    script.onload = () => {
      // @ts-ignore
      window.JsBarcode(svgRef.current, product.sku, {
        format: "CODE128",
        displayValue: true,
        fontSize: 12,
        height: 60,
        margin: 8,
      });

      setTimeout(() => window.print(), 300);
    };
    document.body.appendChild(script);
  }, [product]);

  if (!product) return <div style={{ padding: 20 }}>جاري التحميل...</div>;

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        direction: "rtl",
        textAlign: "center",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        {product.name_ar}
      </div>

      <svg ref={svgRef}></svg>

      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
        {product.sku}
      </div>

      <style>{`
        @page { size: auto; margin: 8mm; }
        body { background: white; }
      `}</style>
    </div>
  );
}
