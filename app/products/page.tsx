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
    </RequireAuth>
  );
