import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import GlobalSplash from "@/components/layout/GlobalSplash";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <html lang="en">
      <body>
        <AuthProvider>
          <GlobalSplash />
          <Header />
          <main className="pb-24 md:pb-0">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

