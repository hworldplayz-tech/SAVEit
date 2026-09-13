/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Download, Sun, Moon } from 'lucide-react';
import Home from './pages/Home';
import FastDownload from './pages/FastDownload';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Header({ isDarkMode, toggleTheme }: { isDarkMode: boolean; toggleTheme: () => void }) {
  return (
    <header className={`sticky top-0 z-50 border-b ${isDarkMode ? 'border-zinc-800 bg-[#0a0a0a]/80' : 'border-zinc-100 bg-white/80'} backdrop-blur-md`}>
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 decoration-transparent group">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            SAVE<span className="text-brand">it</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest opacity-80">
            <Link to="/" className={`transition-all hover:text-brand ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'} decoration-transparent`}>
              Downloader
            </Link>
            <Link to="/fast" className={`transition-all hover:text-brand ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'} decoration-transparent`}>
              Fast Mode
            </Link>
            <a 
              href="https://linksshare.online" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-colors decoration-transparent"
            >
              <span>LinkShare</span>
              <span className="text-[9px] uppercase font-black tracking-wider">Hub</span>
            </a>
          </nav>
          <button 
            onClick={toggleTheme}
            className={`p-2.5 rounded-full border transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-yellow-400 hover:bg-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'} cursor-pointer`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <footer className={`py-12 border-t ${isDarkMode ? 'border-zinc-800 bg-black/40 text-zinc-500' : 'border-zinc-100 bg-zinc-50 text-zinc-500'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                SAVE<span className="text-brand">it</span>
              </span>
            </div>

            <span className="hidden sm:inline text-zinc-400 dark:text-zinc-700">|</span>

            {/* Powered by LinkShare user request */}
            <div className="text-xs font-semibold flex items-center gap-1.5">
              <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>Powered by</span>
              <a 
                href="https://linksshare.online" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-black text-brand hover:underline underline-offset-4 decoration-brand/50 transition-colors inline-flex items-center gap-1"
              >
                LinkShare
              </a>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-[11px] font-black uppercase tracking-[2px]">
            <Link to="/" className={`hover:text-brand transition-colors decoration-transparent ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Downloader</Link>
            <Link to="/fast" className={`hover:text-brand transition-colors decoration-transparent ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Fast Stream</Link>
            <a 
              href="https://linksshare.online" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`hover:text-brand transition-colors decoration-transparent ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
              LinkShare Projects
            </a>
          </div>

          <div className="text-xs font-medium text-zinc-500 text-center md:text-right">
            &copy; {new Date().getFullYear()} SAVEit • A LinkShare Project.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <Router>
      <ScrollToTop />
      <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-zinc-900'} font-sans`}>
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <Routes>
          <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
          <Route path="/fast" element={<FastDownload isDarkMode={isDarkMode} />} />
        </Routes>

        <Footer isDarkMode={isDarkMode} />
      </div>
    </Router>
  );
}
