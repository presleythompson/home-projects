import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Warm display serif for the title/headings.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  display: "swap",
});

// Clean, highly readable sans for body/UI.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "House & Yard Project List",
  description: "Shared household tasks & projects",
};

// resizes-content: the on-screen keyboard shrinks the layout viewport (and
// `fixed inset-0`) to the visible area, so modal overlays stay above the
// keyboard instead of being anchored under it on mobile.
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
