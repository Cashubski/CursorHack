import type { Metadata, Viewport } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";
import Stepper from "@/components/Stepper";

export const metadata: Metadata = {
  title: "PatchPilot - Bug reports to reviewed patches",
  description:
    "Turn messy bug reports into structured agent tasks, dispatch them to a Cursor workflow, and review before merge."
};

export const viewport: Viewport = {
  themeColor: "#1c2f76",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <TopNav />
        <Stepper />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
