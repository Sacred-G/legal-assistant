import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './components/ChatInterface';
import CaseLawResearcher from './components/CaseLawResearcher';
import RateReports from './components/RateReports.jsx';
import LegalDocumentGenerator from './components/LegalDocumentGenerator';
import LegalDocumentReview from './components/LegalDocumentReview';
import SystemAssistant from './components/SystemAssistant';
import CloneInterface from './components/CloneInterface';
import IframePage from './components/IframePage';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function Navigation() {
  const { isDark, toggleTheme, theme, animations } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to}>
        <motion.div
          className={`relative py-4 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {children}
          {isActive && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              layoutId="underline"
              initial={false}
            />
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <nav
      className="shadow-lg"
      style={{
        backgroundColor: isDark ? theme.background.secondary : theme.background.main,
        color: theme.text.primary,
        boxShadow: theme.shadow.md,
        transition: animations.transition.normal
      }}
    >
      <div className="max-w-[99%] mx-auto px-2">
        <div className="flex justify-between items-center h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <span className={`font-bold text-xl ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              AI Legal Assistant
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink to="/">Chat Interface</NavLink>
            <NavLink to="/case-law">Case Law Researcher</NavLink>
            <NavLink to="/rate-reports">Rate Reports</NavLink>
            <NavLink to="/legal-docs">Legal Document Generator</NavLink>
            <NavLink to="/doc-review">Legal Document Review</NavLink>
            <NavLink to="/system">System Assistant</NavLink>
            <NavLink to="/clone">Clone Interface</NavLink>
            <NavLink to="/iframe">Iframe Page</NavLink>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-2 rounded-lg ml-4`}
              style={{
                background: isDark ? theme.background.secondary : theme.background.tertiary,
                color: theme.text.primary,
                boxShadow: theme.shadow.sm,
                transition: animations.transition.fast
              }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg
              className={`w-6 h-6 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Chat Interface
                </Link>
                <Link
                  to="/case-law"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Case Law Researcher
                </Link>
                <Link
                  to="/rate-reports"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Rate Reports
                </Link>
                <Link
                  to="/legal-docs"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Legal Document Generator
                </Link>
                <Link
                  to="/doc-review"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Legal Document Review
                </Link>
                <Link
                  to="/system"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  System Assistant
                </Link>
                <Link
                  to="/clone"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Clone Interface
                </Link>
                <Link
                  to="/iframe"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Iframe Page
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function AppContent() {
  const { isDark, theme, animations } = useTheme();
  const location = useLocation();

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme.background.main
      }}>
      <Navigation />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 max-w-[99%] mx-auto py-2 px-1">
          <Routes>
            <Route
              path="/"
              element={
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ChatInterface />
                </motion.div>
              }
            />
            <Route
              path="/case-law"
              element={
                <motion.div
                  key="case-law"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CaseLawResearcher />
                </motion.div>
              }
            />
            <Route
              path="/rate-reports"
              element={
                <motion.div
                  key="rate-reports"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <RateReports />
                </motion.div>
              }
            />
            <Route
              path="/legal-docs"
              element={
                <motion.div
                  key="legal-docs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LegalDocumentGenerator />
                </motion.div>
              }
            />
            <Route
              path="/doc-review"
              element={
                <motion.div
                  key="doc-review"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LegalDocumentReview />
                </motion.div>
              }
            />
            <Route
              path="/system"
              element={
                <motion.div
                  key="system"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SystemAssistant />
                </motion.div>
              }
            />
            <Route
              path="/clone"
              element={
                <motion.div
                  key="clone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CloneInterface />
                </motion.div>
              }
            />
            <Route
              path="/iframe"
              element={
                <motion.div
                  key="iframe"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <IframePage />
                </motion.div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
