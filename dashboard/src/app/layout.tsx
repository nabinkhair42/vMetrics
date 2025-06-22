import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "VSCode Productivity Tracker",
  description: "Track your coding productivity and digital wellbeing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
