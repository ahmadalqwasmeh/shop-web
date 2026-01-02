"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "../RequireAuth";

type Category = {
  id: number;
  name_ar: string;
  prefix: string;
};

type Product = {
  id: number;
  name_ar: string;
  sku: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
};

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [nameAr, setNameAr] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [minStock, setMinStock] = useState("");

  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("id, name_ar, prefix")
      .eq("is_active", true);
    if (data) setCategories(data);
  }

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("id, name_ar, sku, purchase_price, sale_price, min_stock")
      .order("id", { ascending: false });
    if (data) setProducts(data);
  }

  async function addProduct() {
    if (!nameAr || categoryId === "") {
      alert("أدخل اسم الصنف واختر الفئة");
      return;
    }

    // توليد SKU من الدالة
    const { data: sku, error: skuErr } = await supabase.rpc(
      "generate_sku_for_category",
      { cat_id: categoryId }
    );

    if (skuErr) {
      alert("خطأ بتوليد الكود: " + skuErr.message);
      return;
    }

    const { error } = await supabase.from("products").insert({
      name_ar: nameAr,
      category_id: categoryId,
      sku: sku,
      barcode_value: sku,
      purchase_price: Number(purchasePrice || 0),
      sale_price: Number(salePrice || 0),
      min_stock: Number(minStock || 0),
      is_active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("تمت إضافة الصنف بالكود: " + sku);

    setNameAr("");
    setPurchasePrice("");
    setSalePrice("");
    setMinStock("");

    loadProducts();
  }

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  return (
      <RequireAuth>
    <div style={{ padding: 20, direction: "rtl" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>الأصناف</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        <input
          placeholder="اسم الصنف"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
        />

        <select
          value={categoryId}
          onChange={(e) =>
            setCategoryId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">اختر الفئة</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar} ({c.prefix})
            </option>
          ))}
        </select>

        <input
          placeholder="سعر الشراء"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
        />

        <input
          placeholder="سعر البيع"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
        />

        <input
          placeholder="الحد الأدنى"
          value={minStock}
          onChange={(e) => setMinStock(e.target.value)}
        />

        <button onClick={addProduct}>إضافة صنف</button>
          
      </div>
      </RequireAuth>

      <table style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>الكود</th>
            <th>الاسم</th>
            <th>شراء</th>
            <th>بيع</th>
            <th>حد أدنى</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.sku}</td>
              <td>{p.name_ar}</td>
              <td>{p.purchase_price}</td>
              <td>{p.sale_price}</td>
              <td>{p.min_stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



