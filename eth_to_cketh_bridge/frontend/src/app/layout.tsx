"use client";

import { ReactNode } from 'react';
import '../styles/globals.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 text-black">
        <header className="p-4 flex justify-center bg-blue-600 text-white shadow-md">
          <h1 className="text-xl font-bold">ETH to ckETH Bridge</h1>
        </header>

        <main className="p-4 flex justify-center items-center">
          {children}
        </main>

        <footer className="p-4 bg-blue-600 text-white text-center">
          <p className="text-sm">Powered by ETH & ICP</p>
        </footer>
      </body>
    </html>
  );
}
