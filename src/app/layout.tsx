import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  description: "A secure administrative workspace for managing doctors and patients.",
  robots: { index: false, follow: false },
  title: {
    default: "Doctor Tracker",
    template: "%s | Doctor Tracker",
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
