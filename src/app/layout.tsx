import type { Metadata } from "next";
import { Geist, Playfair_Display, Cinzel } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingPlayer from "@/components/FloatingPlayer";

// Configuración de fuentes optimizadas de Google (display swap por defecto)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Animatrix | Cinema & Animation",
  description: "Cineteca y plataforma de cortometrajes animados con experiencia cinematográfica.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${playfair.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-cinema-black text-white selection:bg-cinema-emerald selection:text-black">
        {/* Capa de textura sutil de celuloide */}
        <div className="film-grain fixed inset-0 pointer-events-none z-50 opacity-[0.032]" aria-hidden="true" />
        
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
          <FloatingPlayer />
        </Providers>
      </body>
    </html>
  );
}
