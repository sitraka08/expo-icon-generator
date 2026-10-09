import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Expo Asset Studio',
  description: 'Visual workspace to create, preview and export icons and splash screens for Expo apps.',
  icons: { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%23FFCD00'/%3E%3Ccircle cx='16' cy='16' r='8' fill='none' stroke='%23000' stroke-width='2.4'/%3E%3Ccircle cx='16' cy='16' r='2.6' fill='%23000'/%3E%3C/svg%3E" },
};

const themeScript = `try{var t=localStorage.getItem('eas-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Google Sans family (UI) and Google Sans Code (technical text) */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:wght@400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
