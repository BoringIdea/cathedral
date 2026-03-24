import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SolanaProvider } from "@/components/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { Theme } from "@radix-ui/themes";
import { I18nProvider } from "@/lib/i18n-context";
import MainLayout from "@/components/layout/main-layout";
import { MobileBlocker } from "@/components/mobile-blocker";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Cathedral",
  description: "Cathedral",
  icons: {
    icon: "/cathedral.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--bg-page)] text-[color:var(--fg-body)]`}
      >
        <Theme>
          <ReactQueryProvider>
            <SolanaProvider>
              <I18nProvider>
                <MainLayout>{children}</MainLayout>
                <MobileBlocker />
              </I18nProvider>
            </SolanaProvider>
          </ReactQueryProvider>
        </Theme>
      </body>
    </html>
  );
}
