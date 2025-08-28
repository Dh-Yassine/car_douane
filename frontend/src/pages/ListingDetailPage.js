import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, MapPin, Car, Package, Wrench } from 'lucide-react';
import { listingsAPI } from '../services/api';
import './ListingDetailPage.css';

const ListingDetailPage = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await listingsAPI.getListing(id);
      setListing(response.data);
    } catch (err) {
      setError('Failed to load listing details');
      console.error('Error fetching listing:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-TN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getListingIcon = (type) => {
    switch (type) {
      case 'vehicle':
        return <Car size={24} />;
      case 'goods':
        return <Package size={24} />;
      case 'tools':
        return <Wrench size={24} />;
      default:
        return <Package size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading listing details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Listing Not Found</h2>
          <p>The listing you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="listing-detail-page">
      <div className="container">
        {/* Back Button */}
        <Link to="/" className="back-button">
          <ArrowLeft size={20} />
          Back to Listings
        </Link>

        <div className="detail-content">
          {/* Main Content */}
          <div className="detail-main">
            {/* Image Section */}
            <div className="detail-image-section">
              {listing.image_url ? (
                <img 
                  src={listing.image_url} 
                  alt={listing.title}
                  className="detail-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="image-placeholder">
                {getListingIcon(listing.listing_type)}
              </div>
            </div>

            {/* Info Section */}
            <div className="detail-info">
              <div className="detail-header">
                <div className="detail-badge">
                  {listing.listing_type}
                </div>
                <h1 className="detail-title">{listing.display_title}</h1>
                <div className="detail-price">
                  <span className="price-label">Starting Price:</span>
                  <span className="price-value">{formatPrice(listing.starting_price)}</span>
                </div>
              </div>

              <div className="detail-meta">
                <div className="meta-item">
                  <MapPin size={18} />
                  <span>{listing.city}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={18} />
                  <span>{formatDate(listing.auction_date)}</span>
                </div>
                {listing.brand && (
                  <div className="meta-item">
                    <span className="brand">{listing.brand}</span>
                    {listing.model && <span className="model">{listing.model}</span>}
                  </div>
                )}
              </div>

              <div className="detail-description">
                <h3>Description</h3>
                <p>{listing.short_description}</p>
                {listing.full_description && (
                  <div className="full-description">
                    <h4>Full Details</h4>
                    <p>{listing.full_description}</p>
                  </div>
                )}
              </div>

              {/* Vehicle-specific details */}
              {listing.listing_type === 'vehicle' && (
                <div className="vehicle-details">
                  <h3>Vehicle Information</h3>
                  <div className="details-grid">
                    {listing.year && (
                      <div className="detail-item">
                        <span className="label">Year:</span>
                        <span className="value">{listing.year}</span>
                      </div>
                    )}
                    {listing.fuel_type && (
                      <div className="detail-item">
                        <span className="label">Fuel Type:</span>
                        <span className="value">{listing.fuel_type}</span>
                      </div>
                    )}
                    {listing.serial_number && (
                      <div className="detail-item">
                        <span className="label">Serial Number:</span>
                        <span className="value">{listing.serial_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Goods-specific details */}
              {listing.listing_type === 'goods' && (
                <div className="goods-details">
                  <h3>Goods Information</h3>
                  <div className="details-grid">
                    {listing.quantity && (
                      <div className="detail-item">
                        <span className="label">Quantity:</span>
                        <span className="value">{listing.quantity}</span>
                      </div>
                    )}
                    {listing.unit && (
                      <div className="detail-item">
                        <span className="label">Unit:</span>
                        <span className="value">{listing.unit}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Guarantee amount */}
              {listing.guarantee_amount && (
                <div className="guarantee-section">
                  <h3>Guarantee Amount</h3>
                  <div className="guarantee-amount">
                    {formatPrice(listing.guarantee_amount)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-sidebar">
            <div className="sidebar-card">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                {listing.original_pdf_url && (
                  <a 
                    href={listing.original_pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <ExternalLink size={18} />
                    View Original PDF
                  </a>
                )}
                <Link to="/" className="btn btn-outline">
                  Browse More Listings
                </Link>
              </div>
            </div>

            <div className="sidebar-card">
              <h3>Auction Information</h3>
              <div className="auction-info">
                <div className="info-item">
                  <span className="label">Lot Number:</span>
                  <span className="value">{listing.lot_number}</span>
                </div>
                <div className="info-item">
                  <span className="label">City:</span>
                  <span className="value">{listing.city}</span>
                </div>
                <div className="info-item">
                  <span className="label">Auction Date:</span>
                  <span className="value">{formatDate(listing.auction_date)}</span>
                </div>
                {listing.auction_group && (
                  <div className="info-item">
                    <span className="label">Group:</span>
                    <span className="value">{listing.auction_group.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
