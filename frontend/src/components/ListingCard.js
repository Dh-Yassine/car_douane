import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Package, Wrench, MapPin, Calendar, DollarSign, ExternalLink, Eye, Clock, AlertTriangle } from 'lucide-react';
import './ListingCard.css';

const ListingCard = ({ listing, viewMode = 'grid' }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'vehicle':
        return <Car size={20} />;
      case 'goods':
        return <Package size={20} />;
      case 'tools':
        return <Wrench size={20} />;
      default:
        return <Package size={20} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'vehicle':
        return 'var(--primary-400)';
      case 'goods':
        return 'var(--accent-400)';
      case 'tools':
        return 'var(--warning)';
      default:
        return 'var(--gray-400)';
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getDeadlineDisplay = (listing) => {
    if (!listing.deadline) return null;
    
    const deadline = new Date(listing.deadline);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        text: `Expired ${Math.abs(diffDays)} days ago`,
        status: 'expired',
        icon: <AlertTriangle size={16} />
      };
    } else if (diffDays === 0) {
      return {
        text: 'Expires today',
        status: 'urgent',
        icon: <AlertTriangle size={16} />
      };
    } else if (diffDays <= 1) {
      return {
        text: `Expires in ${diffDays} day`,
        status: 'urgent',
        icon: <AlertTriangle size={16} />
      };
    } else if (diffDays <= 3) {
      return {
        text: `Expires in ${diffDays} days`,
        status: 'warning',
        icon: <Clock size={16} />
      };
    } else {
      return {
        text: `Expires in ${diffDays} days`,
        status: 'normal',
        icon: <Clock size={16} />
      };
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  if (viewMode === 'list') {
    return (
      <div className="listing-card list-view">
        <div className="card-image-section">
          {listing.image_url ? (
            <>
              <img
                src={listing.image_url}
                alt={listing.title}
                className="card-image"
                onError={handleImageError}
              />
              <div className="image-placeholder" style={{ display: 'none' }}>
                {getTypeIcon(listing.listing_type)}
              </div>
            </>
          ) : (
            <div className="image-placeholder">
              {getTypeIcon(listing.listing_type)}
            </div>
          )}
        </div>

        <div className="card-content">
          <div className="card-header">
            <div className="card-badge" style={{ backgroundColor: getTypeColor(listing.listing_type) }}>
              {getTypeIcon(listing.listing_type)}
              <span>{listing.listing_type}</span>
            </div>
            <div className="card-lot">#{listing.lot_number}</div>
          </div>

          <h3 className="card-title">{listing.title}</h3>
          
          <div className="card-meta">
            <div className="meta-item">
              <MapPin size={16} />
              <span>{listing.city}</span>
            </div>
            <div className="meta-item">
              <Calendar size={16} />
              <span>{formatDate(listing.auction_date)}</span>
            </div>
            {getDeadlineDisplay(listing) && (
              <div className={`meta-item deadline-item deadline-${getDeadlineDisplay(listing).status}`}>
                {getDeadlineDisplay(listing).icon}
                <span>{getDeadlineDisplay(listing).text}</span>
              </div>
            )}
          </div>

          <p className="card-description">{listing.short_description}</p>

          <div className="card-details">
            {listing.brand && (
              <div className="detail-item">
                <span className="detail-label">Brand:</span>
                <span className="detail-value">{listing.brand}</span>
              </div>
            )}
            {listing.model && (
              <div className="detail-item">
                <span className="detail-label">Model:</span>
                <span className="detail-value">{listing.model}</span>
              </div>
            )}
            {listing.year && (
              <div className="detail-item">
                <span className="detail-label">Year:</span>
                <span className="detail-value">{listing.year}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card-sidebar">
          <div className="price-section">
            <div className="price-label">Starting Price</div>
            <div className="price-amount">{formatPrice(listing.starting_price)}</div>
            {listing.guarantee_amount && (
              <div className="guarantee-amount">
                Guarantee: {formatPrice(listing.guarantee_amount)}
              </div>
            )}
          </div>

          <div className="card-actions">
            <Link to={`/listing/${listing.id}`} className="btn btn-primary">
              <Eye size={16} />
              View Details
            </Link>
            {listing.original_pdf_url && (
              <a
                href={listing.original_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <ExternalLink size={16} />
                Original PDF
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="listing-card grid-view">
      <div className="card-image-container">
        {listing.image_url ? (
          <>
            <img
              src={listing.image_url}
              alt={listing.title}
              className="card-image"
              onError={handleImageError}
            />
            <div className="image-placeholder" style={{ display: 'none' }}>
              {getTypeIcon(listing.listing_type)}
            </div>
          </>
        ) : (
          <div className="image-placeholder">
            {getTypeIcon(listing.listing_type)}
          </div>
        )}
        
        <div className="card-overlay">
          <div className="overlay-actions">
            <Link to={`/listing/${listing.id}`} className="overlay-btn">
              <Eye size={18} />
            </Link>
            {listing.original_pdf_url && (
              <a
                href={listing.original_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="overlay-btn"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="card-badge" style={{ backgroundColor: getTypeColor(listing.listing_type) }}>
          {getTypeIcon(listing.listing_type)}
          <span>{listing.listing_type}</span>
        </div>
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{listing.title}</h3>
          <div className="card-lot">#{listing.lot_number}</div>
        </div>

        <div className="card-meta">
          <div className="meta-item">
            <MapPin size={16} />
            <span>{listing.city}</span>
          </div>
          <div className="meta-item">
            <Calendar size={16} />
            <span>{formatDate(listing.auction_date)}</span>
          </div>
          {getDeadlineDisplay(listing) && (
            <div className={`meta-item deadline-item deadline-${getDeadlineDisplay(listing).status}`}>
              {getDeadlineDisplay(listing).icon}
              <span>{getDeadlineDisplay(listing).text}</span>
            </div>
          )}
        </div>

        <p className="card-description">{listing.short_description}</p>

        <div className="card-details">
          {listing.brand && (
            <div className="detail-item">
              <span className="detail-label">Brand:</span>
              <span className="detail-value">{listing.brand}</span>
            </div>
          )}
          {listing.model && (
            <div className="detail-item">
              <span className="detail-label">Model:</span>
              <span className="detail-value">{listing.model}</span>
            </div>
          )}
          {listing.year && (
            <div className="detail-item">
              <span className="detail-label">Year:</span>
              <span className="detail-value">{listing.year}</span>
            </div>
          )}
        </div>

        <div className="card-footer">
          <div className="price-section">
            <div className="price-label">Starting Price</div>
            <div className="price-amount">{formatPrice(listing.starting_price)}</div>
          </div>

          <Link to={`/listing/${listing.id}`} className="btn btn-primary">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
