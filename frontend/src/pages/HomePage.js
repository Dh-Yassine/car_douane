import React, { useState, useEffect, useRef } from "react";
import { Upload, Search, Filter, Grid, List } from "lucide-react";
import { listingsAPI } from "../services/api";
import HeroSection from "../components/HeroSection";
import ListingCard from "../components/ListingCard";
import "./HomePage.css";

const HomePage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    listing_type: "",
    brand: "",
    city: "",
    min_price: "",
    max_price: "",
  });
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  const searchDebounce = useRef(null);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    const delay = filters.search.length > 0 ? 550 : 0;
    searchDebounce.current = setTimeout(() => resetToFirstPage(), delay);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [filters]);

  const fetchListings = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page,
        page_size: pageSize,
      };
      Object.keys(filters).forEach((key) => {
        const val = filters[key];
        if (!val && val !== 0) return;
        if (key === "search") params.search = val.trim(); // Trim search input
        else if (key === "min_price") params.starting_price__gte = val;
        else if (key === "max_price") params.starting_price__lte = val;
        else params[key] = val;
      });
      const response = await listingsAPI.getListings(params);
      
      // Handle pagination response
      if (response.data.results) {
        setListings(response.data.results);
        setTotalCount(response.data.count || 0);
        setTotalPages(Math.ceil((response.data.count || 0) / pageSize));
        setCurrentPage(page);
      } else {
        setListings(response.data || []);
        setTotalCount(response.data?.length || 0);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Could not load listings. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [brandsResp, citiesResp] = await Promise.all([
        listingsAPI.getBrands(),
        listingsAPI.getCities(),
      ]);
      
      // Normalize brands and cities to remove duplicates and normalize case
      const rawBrands = (brandsResp.data && brandsResp.data.brands) || brandsResp.data || [];
      const rawCities = (citiesResp.data && citiesResp.data.cities) || citiesResp.data || [];
      
      // Normalize brands: remove duplicates, normalize case, sort alphabetically
      const normalizedBrands = [...new Set(rawBrands.map(brand => 
        brand ? brand.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''
      ))].filter(brand => brand).sort();
      
      // Normalize cities: remove duplicates, normalize case, sort alphabetically
      const normalizedCities = [...new Set(rawCities.map(city => 
        city ? city.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''
      ))].filter(city => city).sort();
      
      setBrands(normalizedBrands);
      setCities(normalizedCities);
    } catch (err) {
      console.warn("Filter fetch failed:", err);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({ search: "", listing_type: "", brand: "", city: "", min_price: "", max_price: "" });
    resetToFirstPage();
  };

  const getSortedListings = () => {
    const sorted = [...listings];
    switch (sortBy) {
      case 'newest': return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest': return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'price-low': return sorted.sort((a, b) => a.starting_price - b.starting_price);
      case 'price-high': return sorted.sort((a, b) => b.starting_price - a.starting_price);
      case 'name': return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default: return sorted;
    }
  };

  const getActiveFiltersCount = () => Object.values(filters).filter(val => val && val !== '').length;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchListings(page);
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
    fetchListings(1);
  };

  return (
    <div className="home-page">
      {/* Modern Hero Section */}
      <HeroSection />

      {/* Main Content without left sidebar to maximize width */}
      <main className="main-content">
        <div className="container">
          <section className="content-area">
            <div className="content-header" style={{ alignItems: 'center' }}>
              <div className="content-title">
                <h2>Available Listings</h2>
                <p className="content-subtitle">{totalCount} results {filters.search && `for "${filters.search}"`}</p>
              </div>
              <div className="content-controls">
                <div className="view-toggle">
                  <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={18} /></button>
                  <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
                </div>
                <div className="sort-dropdown">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="content-body">
              {error ? (
                <div className="error-state"><div className="error-icon">⚠️</div><h3>Oops! Something went wrong</h3><p>{error}</p><button className="btn btn-primary" onClick={fetchListings}>Try Again</button></div>
              ) : loading ? (
                <div className={`listings-grid ${viewMode === 'list' ? 'list-view' : ''}`}>{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="skeleton-card" aria-hidden />))}</div>
              ) : listings.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🔍</div><h3>No listings found</h3><p>{filters.search ? `No results found for "${filters.search}".` : "No listings are currently available."}</p><div className="empty-actions"><button className="btn btn-outline" onClick={clearFilters}>Clear Filters</button></div></div>
              ) : (
                <>
                  <div className={`listings-grid ${viewMode === 'list' ? 'list-view' : ''}`}>{getSortedListings().map((listing) => (<ListingCard key={listing.id} listing={listing} viewMode={viewMode} />))}</div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination-controls">
                      <div className="pagination-info">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} listings
                      </div>
                      <div className="pagination-buttons">
                        <button 
                          className="pagination-btn" 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button 
                          className="pagination-btn" 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
