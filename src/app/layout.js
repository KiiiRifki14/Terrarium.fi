import { Fredoka, Quicksand } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata = {
  title: "Terrarium.fi",
  description: "Personal AI Finance Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${quicksand.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-forest">
        {children}
      </body>
    </html>
  );
}
