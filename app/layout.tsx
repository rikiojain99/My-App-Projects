import Header from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main className="">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
