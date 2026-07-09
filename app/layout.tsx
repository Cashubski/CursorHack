import type { Metadata, Viewport } from "next";
import "./globals.css";
import Stepper from "@/components/Stepper";

export const metadata: Metadata = {
  title: "PatchPilot",
  description:
    "Turn messy bug reports into structured agent tasks, dispatch them to a Cursor workflow, and review before merge."
};

export const viewport: Viewport = {
  themeColor: "#1c2f76",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen w-full bg-gradient-to-b from-slate-200 to-slate-100 md:py-8">
          {/* Phone frame */}
          <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50 shadow-xl md:min-h-[calc(100vh-4rem)] md:rounded-[2.25rem] md:ring-1 md:ring-slate-200">
            {/* Brand header */}
            <header className="flex items-center gap-2 rounded-t-none bg-brand-900 px-5 py-4 text-white md:rounded-t-[2.25rem]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-lg">
                🛩️
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">
                  PatchPilot
                </p>
                <p className="text-[11px] text-brand-200">
                  Bug report to reviewed patch
                </p>
              </div>
            </header>

            <Stepper />

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-40 pt-4">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
