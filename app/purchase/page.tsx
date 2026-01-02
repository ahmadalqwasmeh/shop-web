  return (
    <RequireAuth>
      <div style={{ padding: 20, direction: "rtl" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>فاتورة شراء (وارد)</h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          <select
            value={selectedProductId}
            onChange={(e) =>
              setSelectedProductId(e.target.value ? Number(e.target.value) : "")
            }
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
ليق الـ return وإغلاق `</RequireAuth>` على السطر الصحيح مباشرة بعد `</div>` وليس قبلها.

---

**ملاحظة**: أنا قصّيت الكود هنا؟ لا، لازم أكمله كاملًا جاهز للنسخ. أكمل:

```tsx
          style={{ padding: 10, width: 120 }}
          />

          <input
            placeholder="سعر الشراء"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ padding: 10, width: 140 }}
          />

          <button onClick={addLine} style={{ padding: "10px 14px", cursor: "pointer" }}>
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

        <button
          onClick={saveInvoice}
          style={{ marginTop: 12, padding: "10px 14px", cursor: "pointer" }}
        >
          حفظ الفاتورة + إضافة للمخزون
        </button>

        <p style={{ marginTop: 12, color: "#666" }}>
          افتح الرابط: <b>/purchase</b>
        </p>
      </div>
    </RequireAuth>
  );
