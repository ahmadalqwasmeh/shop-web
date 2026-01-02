import "./globals.css";

export const metadata = {
  title: "إدارة المحل",
  description: "نظام مخزون وفواتير",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="appShell">
          <header className="topbar">
            <div className="brand">إدارة المحل</div>

            <nav className="nav">
              <a className="navLink" href="/categories">الفئات</a>
              <a className="navLink" href="/products">الأصناف</a>
              <a className="navLink" href="/purchase">شراء</a>
              <a className="navLink" href="/sale">بيع</a>
              <a className="navLink" href="/stock">المخزون</a>
              <a className="navLink" href="/login">تسجيل الدخول</a>
            </nav>
          </header>

          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  );
}
