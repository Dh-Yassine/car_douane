import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Upload, Home, Menu, X, Shield } from 'lucide-react';
import './Header.css';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
];

// Admin items - only shown to admin users
const adminNavItems = [
  { path: '/admin', label: 'Admin', icon: Upload },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Check if user is admin (for demo purposes)
  const isAdmin = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('admin') === 'true' || localStorage.getItem('isAdmin') === 'true';
  };

  const allNavItems = isAdmin() ? [...navItems, ...adminNavItems] : navItems;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo/Brand */}
        <NavLink to="/" className="header-brand">
          <div className="brand-icon">
            <Search size={24} />
          </div>
          <div className="brand-content">
            <h1 className="brand-title">Douane Auction Viewer</h1>
            <p className="brand-subtitle">Tunisian Customs Auctions</p>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          {allNavItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Admin Badge */}
          {isAdmin() && (
            <div className="admin-badge">
              <Shield size={16} />
              <span>Admin</span>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
        <div className="mobile-nav-content">
          {allNavItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
          
          {/* Mobile Admin Badge */}
          {isAdmin() && (
            <div className="mobile-admin-badge">
              <Shield size={16} />
              <span>Administrator Access</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-nav-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
