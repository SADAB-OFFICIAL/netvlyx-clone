// app/layout.tsx

import type { Metadata } from "next";
// ... baaki imports same rakhein

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), // <-- YE LINE ADD KAREIN
  title: "Sadabefy - Stream Movies & Series",
  description: "Your premium entertainment destination.",
  openGraph: {
    title: "Sadabefy",
    description: "Watch Movies & Series Online",
    siteName: "Sadabefy",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ... baaki code same rakhein
  return (
    <html lang="en">
      <body className="...">
        {children}
      </body>
    </html>
  );
}
