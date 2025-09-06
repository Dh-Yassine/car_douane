import React, { useState, useEffect } from 'react';
import { Search, Filter, X, TrendingUp, Users, Calendar } from 'lucide-react';
import { listingsAPI } from '../services/api';

const HeroSection = ({ onFiltersChange, filters, brands, cities, totalCount }) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    search: "",
    listing_type: "",
    brand: "",
    city: "",
  });

  useEffect(() => {
    if (filters) {
      setLocalFilters(filters);
    }
  }, [filters]);

  const handleFiltersChange = (newFilters) => {
    const updatedFilters = { ...localFilters, ...newFilters };
    setLocalFilters(updatedFilters);
    if (onFiltersChange) {
      onFiltersChange(updatedFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = { search: "", listing_type: "", brand: "", city: "" };
    setLocalFilters(clearedFilters);
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="hero-particles"></div>
        <div className="hero-gradient"></div>
      </div>
      
      <div className="hero-container">
        <div className="hero-content">
          {/* Hero Text */}
          <div className="hero-text">
            <h1 className="hero-title">
              Discover Tunisian Customs
              <span className="hero-highlight"> Auctions</span>
            </h1>
            <p className="hero-description">
              Explore premium vehicles, goods, and tools from Tunisian customs auctions. 
              Find your next great deal with our comprehensive search and filtering system.
            </p>
          </div>

          {/* Search Section */}
          <div className="hero-search">
            <div className="search-container">
              <div className="search-header">
                <div className="search-icon-wrapper">
                  <Search size={20} />
                </div>
                <h3 className="search-title">Find Your Perfect Item</h3>
              </div>

              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search for vehicles, goods, or tools..."
                  value={localFilters.search}
                  onChange={(e) => handleFiltersChange({ search: e.target.value })}
                  className="search-input"
                />
                {localFilters.search && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => handleFiltersChange({ search: "" })}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="search-filters">
                <div className="filter-group">
                  <label className="filter-label">
                    <Filter size={16} />
                    Category
                  </label>
                  <select
                    value={localFilters.listing_type}
                    onChange={(e) => handleFiltersChange({ listing_type: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">All Categories</option>
                    <option value="vehicle">🚗 Vehicles</option>
                    <option value="goods">📦 Goods</option>
                    <option value="tools">🔧 Tools</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    <TrendingUp size={16} />
                    Brand
                  </label>
                  <select
                    value={localFilters.brand}
                    onChange={(e) => handleFiltersChange({ brand: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">All Brands</option>
                    {brands && brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    <Users size={16} />
                    Location
                  </label>
                  <select
                    value={localFilters.city}
                    onChange={(e) => handleFiltersChange({ city: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">All Cities</option>
                    {cities && cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="filter-actions">
                  <button onClick={clearFilters} className="clear-filters-btn">
                    <X size={16} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="hero-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{totalCount || 0}</div>
                  <div className="stat-label">Available Listings</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <Calendar size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">24</div>
                  <div className="stat-label">Active Auctions</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">1.2K</div>
                  <div className="stat-label">Registered Users</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="hero-cta">
            <a
              href="https://www.douane.gov.tn/wp-content/uploads/2025/08/2025-08-15_AV_OP_Sousse_N%C2%B008-2025_CG.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button"
            >
              <div className="cta-content">
                <div className="cta-icon">📋</div>
                <div className="cta-text">
                  <div className="cta-title">Cahier des Charges</div>
                  <div className="cta-subtitle">View Auction Specifications</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
