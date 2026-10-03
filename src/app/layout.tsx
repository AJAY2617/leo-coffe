import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leo Coffe — A little joy, freshly brewed",
  description: "Your daily ritual, delivered. Order specialty coffee, matcha, and fresh bakes from Leo Coffe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
