import { ToastProvider } from "../lib/ToastContext";
import SocialProof from "../components/SocialProof";
import FloatingSupport from "../components/FloatingSupport";
import "./globals.css";

export const metadata = {
  title: "Aapnexa - Engineering Modern Minimalism",
  description: "Elite everyday wear for the modern individual. Premium cotton essentials engineered for superior comfort and timeless style. Experience high-status streetwear in India.",
  keywords: ["Aapnexa", "Premium T-shirts India", "Minimalist Streetwear", "Cotton Oversized Tees", "Modern Fashion Brand India"],
  openGraph: {
    title: "Aapnexa | Engineering Modern Minimalism",
    description: "Premium everyday wear engineered for comfort and modern aesthetics. Shop our exclusive collection.",
    url: "https://aapnexa.com",
    siteName: "Aapnexa",
    images: [
      {
        url: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200",
        width: 1200,
        height: 630,
        alt: "Aapnexa Premium Collection Preview",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aapnexa - Engineering Modern Minimalism",
    description: "Premium cotton essentials engineered for superior comfort and timeless style.",
    images: ["https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;500;700;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          {children}
          <SocialProof />
          <FloatingSupport />
        </ToastProvider>
      </body>
    </html>
  );
}
