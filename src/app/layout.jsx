"use client"; // <-- important for using usePathname
import "./globals.css";
import Layout from "@/components/Layout";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const noLayoutPages = ["/login", "/signup"];
  const shouldUseLayout = !noLayoutPages.includes(pathname);

  return (
    <html lang="en">
      <body>
        {shouldUseLayout ? <Layout>{children}</Layout> : children}
      </body>
    </html>
  );
}
