import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LANDOS — Land Development Intelligence",
  description: "Land Development Intelligence and Investor Reporting System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="no-print"><Navbar /></div>
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
