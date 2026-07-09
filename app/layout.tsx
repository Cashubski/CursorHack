import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import TopNav from "@/components/TopNav";
import Stepper from "@/components/Stepper";

export const metadata: Metadata = {
  title: "PatchPilot - Bug reports to reviewed patches",
  description:
    "Turn messy bug reports into structured agent tasks, dispatch them to a Cursor workflow, and review before merge.",
  metadataBase: new URL("https://patchpilot-psi.vercel.app")
};

export const viewport: Viewport = {
  themeColor: "#0c0e16",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-ink-50 font-sans">
        <TopNav />
        <Stepper />
        <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-2 border-t border-ink-200/70 pt-6 text-xs text-ink-400 sm:flex-row">
            <p>PatchPilot — from bug report to reviewed patch.</p>
            <p className="font-mono">Built for CursorHack</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
