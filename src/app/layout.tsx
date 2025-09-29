import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import {
  ClerkProvider,
  SignedIn,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Flashy Cardy Course",
  description: "Learn with interactive flashcards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{ baseTheme: dark }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" className="dark">
        <body
          className={`${poppins.variable} antialiased`}
        >
          <header className="flex justify-between items-center p-4 border-b border-gray-800">
            <Link href="/">
              <h1 className="text-xl font-semibold hover:text-primary cursor-pointer">
                Flashy Cardy Course
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <SignedIn>
                <Link href="/dashboard" className="text-sm hover:text-primary">
                  Dashboard
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
