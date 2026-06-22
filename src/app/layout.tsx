import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClientVault — Freelancer Onboarding & Document Hub",
  description: "Branded client portals, smart intake forms, and status tracking for freelancers. No more chasing documents through email.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}