"use client";

import { ReactNode } from 'react';
import '../styles/globals.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-black">
        <header className="p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">ETH to ckETH Bridge</h1>
        </header>

        <main className="p-4">
          {children}
        </main>

        <footer className="p-4">
          {/* Footer content if needed */}
        </footer>
      </body>
    </html>
  );
}

