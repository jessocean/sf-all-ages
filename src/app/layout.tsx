import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SF All-Ages Social Club",
  description: "Find kid-friendly places and events in San Francisco where everyone is welcome",
  keywords: ["San Francisco", "family-friendly", "kids", "events", "venues", "all-ages"],
  openGraph: {
    title: "SF All-Ages Social Club",
    description: "Find kid-friendly places and events in San Francisco where everyone is welcome",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <a href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
                SF All-Ages Social Club
              </a>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 py-6">
            <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
              <p>Find places and events where everyone is welcome.</p>
              <p className="mt-2">
                <a href="/about" className="hover:underline">About</a>
                {" · "}
                <a href="/submit" className="hover:underline">Suggest a venue</a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
