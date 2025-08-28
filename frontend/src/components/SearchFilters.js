import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import './SearchFilters.css';

const SearchFilters = ({ onFiltersChange, filters, brands, cities }) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      listing_type: '',
      brand: '',
      city: '',
      min_price: '',
      max_price: '',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  return (
    <div className="search-filters">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search listings..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className={`filter-toggle ${isFiltersOpen ? 'active' : ''}`}
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {isFiltersOpen && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters">
                <X size={16} />
                Clear All
              </button>
            )}
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label>Type</label>
              <select
                value={localFilters.listing_type || ''}
                onChange={(e) => handleFilterChange('listing_type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="vehicle">Vehicle</option>
                <option value="goods">Goods</option>
                <option value="tools">Tools</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Brand</label>
              <select
                value={localFilters.brand || ''}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>City</label>
              <select
                value={localFilters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Min Price (TND)</label>
              <input
                type="number"
                placeholder="Min"
                value={localFilters.min_price || ''}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Max Price (TND)</label>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.max_price || ''}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
