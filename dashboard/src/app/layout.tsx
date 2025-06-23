import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Poppins } from "next/font/google";
import { defaultSEO, getStructuredData } from "@/config/seo-config";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = defaultSEO;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = getStructuredData();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className={poppins.className} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--background)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                },
              }}
              
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
