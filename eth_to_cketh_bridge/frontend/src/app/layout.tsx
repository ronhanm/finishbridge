"use client"; // Ensure this is here

import { ReactNode, useState, useEffect } from 'react';
import WalletConnection from '../components/WalletConnection';
import '../styles/globals.css';

export default function Layout({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  // Optionally persist the dark mode preference in localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white">
        <header className="p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">ETH to ckETH Bridge</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Toggle Dark Mode
          </button>
        </header>

        {/* Main content of the page */}
        <main className="p-4">
          {children}
        </main>

        {/* Wallet Connection Component */}
        <footer className="p-4">
          <WalletConnection />
        </footer>
      </body>
    </html>
  );
}
