import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Filter, X, Save, TrendingUp, MapPin, Calendar, DollarSign, Car, Package, Wrench, Bookmark } from "lucide-react";
import { listingsAPI } from "../services/api";
import ListingCard from "../components/ListingCard";
import SearchFilters from "../components/SearchFilters";
import "./SearchPage.css";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(true);
  const searchDebounce = useRef(null);

  // Get filters from URL params
  const getFiltersFromURL = () => {
    return {
      search: searchParams.get('q') || '',
      listing_type: searchParams.get('type') || '',
      brand: searchParams.get('brand') || '',
      city: searchParams.get('city') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      year_min: searchParams.get('year_min') || '',
      year_max: searchParams.get('year_max') || '',
      fuel_type: searchParams.get('fuel_type') || '',
    };
  };

  const [filters, setFilters] = useState(getFiltersFromURL());

  // Update URL when filters change
  const updateURL = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key === 'search' ? 'q' : key, value);
    });
    setSearchParams(params);
  };

  // Check if user is logged in (for demo purposes)
  const isLoggedIn = () => {
    return localStorage.getItem('isLoggedIn') === 'true';
  };

  // Fetch data on mount
  useEffect(() => {
    fetchFilters();
    fetchSavedSearches();
    // Show filters by default on desktop
    setFiltersVisible(window.innerWidth >= 768);
  }, []);

  // Fetch listings when filters change
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    const delay = filters.search.length > 0 ? 550 : 0;
    searchDebounce.current = setTimeout(() => {
      fetchListings();
      updateURL(filters);
    }, delay);

    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [filters]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      Object.keys(filters).forEach((key) => {
        const val = filters[key];
        if (!val && val !== 0) return;
        if (key === "search") params.search = val;
        else if (key === "min_price") params.starting_price__gte = val;
        else if (key === "max_price") params.starting_price__lte = val;
        else if (key === "year_min") params.year__gte = val;
        else if (key === "year_max") params.year__lte = val;
        else params[key] = val;
      });

      const response = await listingsAPI.getListings(params);
      const items = response.data.results ?? response.data ?? [];
      setListings(items);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Could not load search results. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [brandsResp, citiesResp, statsResp] = await Promise.all([
        listingsAPI.getBrands(),
        listingsAPI.getCities(),
        listingsAPI.getStats(),
      ]);
      setBrands(brandsResp.data || []);
      setCities(citiesResp.data || []);
      setStats(statsResp.data || {});
    } catch (err) {
      console.warn("Filter fetch failed:", err);
    }
  };

  const fetchSavedSearches = async () => {
    // Mock saved searches for demo - in real app, fetch from backend
    const mockSearches = [
      { id: 1, name: "Mercedes Vehicles", filters: { search: "Mercedes", listing_type: "vehicle" } },
      { id: 2, name: "High Value Items", filters: { min_price: "10000" } },
      { id: 3, name: "Tunis Items", filters: { city: "Tunis" } },
      { id: 4, name: "Recent Cars", filters: { listing_type: "vehicle", year_min: "2015" } },
    ];
    setSavedSearches(mockSearches);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      listing_type: "",
      brand: "",
      city: "",
      min_price: "",
      max_price: "",
      year_min: "",
      year_max: "",
      fuel_type: "",
    };
    setFilters(clearedFilters);
    updateURL(clearedFilters);
  };

  const removeFilter = (filterKey) => {
    const newFilters = { ...filters, [filterKey]: "" };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const saveSearch = () => {
    if (!isLoggedIn()) {
      alert("Please log in to save searches.");
      return;
    }
    setShowSaveSearchModal(true);
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      alert("Please enter a name for this search.");
      return;
    }

    const newSearch = {
      id: Date.now(),
      name: searchName.trim(),
      filters: { ...filters },
      created_at: new Date().toISOString()
    };
    
    setSavedSearches(prev => [...prev, newSearch]);
    setSearchName('');
    setShowSaveSearchModal(false);
    
    // In a real app, save to backend
    alert("Search saved successfully!");
  };

  const loadSavedSearch = (savedSearch) => {
    setFilters(savedSearch.filters);
    updateURL(savedSearch.filters);
  };

  const deleteSavedSearch = (searchId) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
  };

  const getSortedListings = () => {
    const sorted = [...listings];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'price-low':
        return sorted.sort((a, b) => a.starting_price - b.starting_price);
      case 'price-high':
        return sorted.sort((a, b) => b.starting_price - a.starting_price);
      case 'name':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'year-newest':
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'year-oldest':
        return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
      default:
        return sorted;
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(val => val && val !== '').length;
  };

  const getFilterChips = () => {
    const chips = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        let label = '';
        let displayValue = value;
        
        switch (key) {
          case 'search':
            label = 'Search';
            break;
          case 'listing_type':
            label = 'Type';
            displayValue = value.charAt(0).toUpperCase() + value.slice(1);
            break;
          case 'brand':
            label = 'Brand';
            break;
          case 'city':
            label = 'City';
            break;
          case 'min_price':
            label = 'Min Price';
            displayValue = `${value} TND`;
            break;
          case 'max_price':
            label = 'Max Price';
            displayValue = `${value} TND`;
            break;
          case 'year_min':
            label = 'Min Year';
            break;
          case 'year_max':
            label = 'Max Year';
            break;
          case 'fuel_type':
            label = 'Fuel Type';
            displayValue = value.charAt(0).toUpperCase() + value.slice(1);
            break;
        }
        
        chips.push({ key, label, value: displayValue });
      }
    });
    return chips;
  };

  return (
    <div className="search-page">
      {/* Search Header */}
      <section className="search-header">
        <div className="container">
          <div className="search-header-content">
            <div className="search-header-left">
              <h1 className="search-title">
                Search Results
                {filters.search && (
                  <span className="search-query"> for "{filters.search}"</span>
                )}
              </h1>
              <p className="search-subtitle">
                {listings.length} results found
                {getActiveFiltersCount() > 0 && ` with ${getActiveFiltersCount()} active filters`}
              </p>
            </div>
            
            <div className="search-header-actions">
              {isLoggedIn() && (
                <button className="btn btn-outline" onClick={saveSearch}>
                  <Save size={16} />
                  Save Search
                </button>
              )}
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                <Search size={16} />
                New Search
              </button>
            </div>
          </div>

          {/* Search Chips */}
          {getActiveFiltersCount() > 0 && (
            <div className="search-chips">
              <div className="chips-label">Active Filters:</div>
              <div className="chips-container">
                {getFilterChips().map(({ key, label, value }) => (
                  <div key={key} className="filter-chip">
                    <span className="chip-label">{label}:</span>
                    <span className="chip-value">{value}</span>
                    <button
                      className="chip-remove"
                      onClick={() => removeFilter(key)}
                      aria-label={`Remove ${label} filter`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button className="clear-all-btn" onClick={clearFilters}>
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="saved-searches">
              <div className="saved-searches-label">
                <Bookmark size={16} />
                Saved Searches:
              </div>
              <div className="saved-searches-list">
                {savedSearches.map((search) => (
                  <div key={search.id} className="saved-search-item">
                    <button
                      className="saved-search-btn"
                      onClick={() => loadSavedSearch(search)}
                    >
                      {search.name}
                    </button>
                    <button
                      className="delete-search-btn"
                      onClick={() => deleteSavedSearch(search.id)}
                      aria-label={`Delete saved search: ${search.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="search-main">
        <div className="container">
          <div className="search-layout">
            {/* Filters Sidebar - Visible by default on desktop */}
            <aside className={`filters-sidebar ${filtersVisible ? 'visible' : ''}`}>
              <div className="filters-header">
                <h3>Filters & Search</h3>
                <div className="filters-count">
                  {getActiveFiltersCount()} active
                </div>
                <button 
                  className="filters-toggle mobile-only"
                  onClick={() => setFiltersVisible(!filtersVisible)}
                >
                  <X size={16} />
                </button>
              </div>
              
              <SearchFilters
                onFiltersChange={handleFiltersChange}
                filters={filters}
                brands={brands}
                cities={cities}
              />
              
              <div className="filters-actions">
                <button className="btn btn-outline" onClick={clearFilters}>
                  Clear All
                </button>
                <button className="btn btn-primary" onClick={fetchListings}>
                  Apply Filters
                </button>
              </div>
            </aside>

            {/* Results Area */}
            <section className="results-area">
              {/* Results Header */}
              <div className="results-header">
                <div className="results-info">
                  <div className="results-count">
                    {loading ? 'Loading...' : `${listings.length} results`}
                  </div>
                  {filters.search && (
                    <div className="search-term">
                      for "{filters.search}"
                    </div>
                  )}
                </div>
                
                <div className="results-controls">
                  {/* Mobile Filters Toggle */}
                  <button 
                    className="filters-toggle desktop-hidden"
                    onClick={() => setFiltersVisible(!filtersVisible)}
                  >
                    <Filter size={16} />
                    Filters ({getActiveFiltersCount()})
                  </button>

                  {/* View Mode Toggle */}
                  <div className="view-toggle">
                    <button
                      className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      Grid
                    </button>
                    <button
                      className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      List
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="sort-dropdown">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="sort-select"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name A-Z</option>
                      <option value="year-newest">Year: Newest First</option>
                      <option value="year-oldest">Year: Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Body */}
              <div className="results-body">
                {error ? (
                  <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Search Error</h3>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchListings}>
                      Try Again
                    </button>
                  </div>
                ) : loading ? (
                  <div className={`listings-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="skeleton-card" aria-hidden />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>
                      {filters.search 
                        ? `No results found for "${filters.search}". Try adjusting your search terms or filters.`
                        : "No listings match your current filters. Try broadening your search criteria."
                      }
                    </p>
                    <div className="empty-actions">
                      <button className="btn btn-outline" onClick={clearFilters}>
                        Clear Filters
                      </button>
                      <button className="btn btn-primary" onClick={() => navigate('/')}>
                        Browse All
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`listings-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                    {getSortedListings().map((listing) => (
                      <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSaveSearchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Save Search</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSaveSearchModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="searchName">Search Name</label>
                <input
                  type="text"
                  id="searchName"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Enter a name for this search..."
                  className="form-input"
                />
              </div>
              <div className="search-preview">
                <h4>Search Criteria:</h4>
                <div className="search-criteria">
                  {getFilterChips().map(({ key, label, value }) => (
                    <span key={key} className="criteria-chip">
                      {label}: {value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowSaveSearchModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveSearch}
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
