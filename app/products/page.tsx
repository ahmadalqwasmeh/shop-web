"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "../RequireAuth";

type Category = { id: number; name_ar: string; prefix: string };

type Product = {
  id: number;
  name_ar: string;
  sku: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  is_active: boolean;
  category_id: number;
};

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // إضافة منتج
  const [nameAr, setNameAr] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [minStock, setMinStock] = useState("");

  // ✅ تعديل منتج
  const [editing, setEditing] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | "">("");
  const [editPurchase, setEditPurchase] = useState("");
  const [editSale, setEditSale] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editActive, setEditActive] = useState(true);

  async function loadCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name_ar, prefix")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (error) return alert(error.message);
    setCategories((data ?? []) as Category[]);
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name_ar, sku, purchase_price, sale_price, min_stock, is_active, category_id")
      .order("id", { ascending: false });

    if (error) return alert(error.message);
    setProducts((data ?? []) as Product[]);
  }

  async function addProduct() {
    if (!nameAr.trim() || categoryId === "") return alert("أدخل اسم الصنف واختر الفئة");

    const { data: sku, error: skuErr } = await supabase.rpc("generate_sku_for_category", {
      cat_id: categoryId,
    });
    if (skuErr) return alert("خطأ بتوليد الكود: " + skuErr.message);

    const { error } = await supabase.from("products").insert({
      name_ar: nameAr.trim(),
      category_id: categoryId,
      sku,
      barcode_value: sku,
      purchase_price: Number(purchasePrice || 0),
      sale_price: Number(salePrice || 0),
      min_stock: Number(minStock || 0),
      is_active: true,
    });

    if (error) return alert(error.message);

    alert("تمت إضافة الصنف بالكود: " + sku);

    setNameAr("");
    setPurchasePrice("");
    setSalePrice("");
    setMinStock("");

    loadProducts();
  }

  function startEdit(p: Product) {
    setEditing(p);
    setEditName(p.name_ar);
    setEditCategoryId(p.category_id);
    setEditPurchase(String(p.purchase_price ?? 0));
    setEditSale(String(p.sale_price ?? 0));
    setEditMin(String(p.min_stock ?? 0));
    setEditActive(!!p.is_active);
  }

  async function saveEdit() {
    if (!editing) return;

    if (!editName.trim() || editCategoryId === "") {
      return alert("اسم الصنف والفئة مطلوبين");
    }

    const { error } = await supabase
      .from("products")
      .update({
        name_ar: editName.trim(),
        category_id: editCategoryId,
        purchase_price: Number(editPurchase || 0),
        sale_price: Number(editSale || 0),
        min_stock: Number(editMin || 0),
        is_active: editActive,
      })
      .eq("id", editing.id);

    if (error) return alert(error.message);

    setEditing(null);
    await loadProducts();
    alert("تم حفظ التعديل ✅");
  }

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  return (
    <RequireAuth>
      <div style={{ padding: 20, direction: "rtl" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>الأصناف</h1>

        {/* إضافة صنف */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          <input placeholder="اسم الصنف" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">اختر الفئة</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar} ({c.prefix})
              </option>
            ))}
          </select>
          <input placeholder="سعر الشراء" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
          <input placeholder="سعر البيع" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
          <input placeholder="الحد الأدنى" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          <button onClick={addProduct}>إضافة صنف</button>
        </div>

        {/* ✅ نافذة تعديل */}
        {editing && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>تعديل الصنف: {editing.sku}</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="اسم الصنف" />
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">اختر الفئة</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar} ({c.prefix})
                  </option>
                ))}
              </select>
              <input value={editPurchase} onChange={(e) => setEditPurchase(e.target.value)} placeholder="سعر الشراء" />
              <input value={editSale} onChange={(e) => setEditSale(e.target.value)} placeholder="سعر البيع" />
              <input value={editMin} onChange={(e) => setEditMin(e.target.value)} placeholder="الحد الأدنى" />

              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                مفعّل
              </label>

              <button onClick={saveEdit}>حفظ</button>
              <button onClick={() => setEditing(null)}>إلغاء</button>
            </div>
          </div>
        )}

        {/* جدول */}
        <table style={{ width: "100%", marginTop: 16 }}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>الاسم</th>
              <th>شراء</th>
              <th>بيع</th>
              <th>حد أدنى</th>
              <th>مفعّل</th>
              <th></th>
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
                <td>{p.is_active ? "نعم" : "لا"}</td>
                <td>
                  <button onClick={() => startEdit(p)}>تعديل</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: 12, color: "#666" }}>
          افتح الرابط: <b>/products</b>
        </p>
      </div>
    </RequireAuth>
  );
}
