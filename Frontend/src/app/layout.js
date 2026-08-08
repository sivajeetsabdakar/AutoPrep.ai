import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";
import Toaster from "@/components/ui/toaster";
import { AppSessionProvider } from "@/components/session-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AutoPrep.ai - JEE/NEET Practice',
  description: 'Upload your notes, find topic-matched questions, practice daily problems, and track your progress.',
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </AppSessionProvider>
      </body>
    </html>
  );
}
