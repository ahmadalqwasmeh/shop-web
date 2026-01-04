import "./globals.css";
import Topbar from "./Topbar";

export const metadata = {
  title: "إدارة المحل",
  description: "نظام مخزون وفواتير",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="appShell">
          {/* ✅ الشريط العلوي يظهر فقط بعد تسجيل الدخول */}
          <Topbar />

          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  );
}
