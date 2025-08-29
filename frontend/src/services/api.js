import axios from 'axios';

// Dynamic API base URL configuration
const getApiBaseUrl = () => {
  // If we have an environment variable, use it (for production)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Get the current hostname and port from the browser
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  
  // If accessing from localhost, use localhost:8000
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // If accessing from any other IP (like 192.168.1.1), use the same IP with port 8000
  if (currentHost !== 'localhost' && !currentHost.includes('vercel.app') && !currentHost.includes('netlify.app')) {
    return `http://${currentHost}:8000`;
  }
  
  // For production deployments (Vercel, Netlify), default to our Render backend
  return 'https://car-douane.onrender.com';
};

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to log API calls (for debugging)
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const listingsAPI = {
  // Get all listings with pagination
  getListings: (params = {}) => {
    return api.get('/api/listings/', { params });
  },

  // Get all listings for admin view (no pagination)
  getAdminListings: (params = {}) => {
    return api.get('/api/listings/admin_list/', { params });
  },

  // Get a specific listing by ID
  getListing: (id) => {
    return api.get(`/api/listings/${id}/`);
  },

  // Update a listing
  updateListing: (id, data) => {
    return api.patch(`/api/listings/${id}/`, data);
  },

  // Delete a listing
  deleteListing: (id) => {
    return api.delete(`/api/listings/${id}/`);
  },

  // Get listing statistics
  getStats: () => {
    return api.get('/api/listings/stats/');
  },

  // Get available brands
  getBrands: () => {
    return api.get('/api/listings/brands/');
  },

  // Get available cities
  getCities: () => {
    return api.get('/api/listings/cities/');
  },

  // Search listings
  searchListings: (query, filters = {}) => {
    return api.get('/api/listings/search/', {
      params: { q: query, ...filters }
    });
  },

  // Set deadlines by date range
  setDeadlinesByDateRange: (data) => {
    return api.post('/api/listings/set_deadlines_by_date_range/', data);
  },

  // Set deadlines by PDF/JSON file
  setDeadlinesByPdf: (data) => {
    return api.post('/api/listings/set_deadlines_by_pdf/', data);
  },

  // Get expired listings
  getExpiredListings: () => {
    return api.get('/api/listings/expired_listings/');
  },

  // Get urgent listings (1 day or less)
  getUrgentListings: () => {
    return api.get('/api/listings/urgent_listings/');
  },

  // Debug endpoint to see listing data
  debugListings: () => {
    return api.get('/api/listings/debug_listings/');
  },
};

export const pdfUploadsAPI = {
  // Get all PDF uploads
  getPDFUploads: (params = {}) => {
    return api.get('/api/pdf-uploads/', { params });
  },

  // Upload a new PDF
  uploadPDF: (formData) => {
    return api.post('/api/pdf-uploads/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Extract text from PDF
  extractTxt: (uploadId) => {
    return api.post(`/api/pdf-uploads/${uploadId}/extract_txt/`);
  },

  // Get extracted text
  getTxt: (uploadId) => {
    return api.get(`/api/pdf-uploads/${uploadId}/txt/`);
  },

  // Import JSON data
  importJson: (uploadId, jsonFile) => {
    const formData = new FormData();
    formData.append('json_file', jsonFile);
    return api.post(`/api/pdf-uploads/${uploadId}/import_json/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Import JSON without PDF
  importJsonNoPdf: (jsonFile, extra = {}) => {
    const formData = new FormData();
    formData.append('json_file', jsonFile);
    if (extra.city) formData.append('city', extra.city);
    if (extra.auction_date) formData.append('auction_date', extra.auction_date);
    return api.post('/api/pdf-uploads/import_json_no_pdf/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete PDF upload
  deletePDFUpload: (uploadId) => {
    return api.delete(`/api/pdf-uploads/${uploadId}/`);
  },
};

export const authAPI = {
  // Login user
  login: (credentials) => {
    return api.post('/api/auth/login/', credentials);
  },

  // Logout user
  logout: () => {
    return api.post('/api/auth/logout/');
  },

  // Get current user
  getCurrentUser: () => {
    return api.get('/api/auth/user/');
  },

  // Refresh token
  refreshToken: () => {
    return api.post('/api/auth/refresh/');
  },
};

export const jobsAPI = {
  // Get all jobs
  getJobs: (params = {}) => {
    return api.get('/api/jobs/', { params });
  },

  // Get job details
  getJob: (id) => {
    return api.get(`/api/jobs/${id}/`);
  },

  // Retry failed job
  retryJob: (id) => {
    return api.post(`/api/jobs/${id}/retry/`);
  },

  // Cancel running job
  cancelJob: (id) => {
    return api.post(`/api/jobs/${id}/cancel/`);
  },
};

export const usersAPI = {
  // Get all users
  getUsers: (params = {}) => {
    return api.get('/api/users/', { params });
  },

  // Get user details
  getUser: (id) => {
    return api.get(`/api/users/${id}/`);
  },

  // Create new user
  createUser: (userData) => {
    return api.post('/api/users/', userData);
  },

  // Update user
  updateUser: (id, userData) => {
    return api.patch(`/api/users/${id}/`, userData);
  },

  // Delete user
  deleteUser: (id) => {
    return api.delete(`/api/users/${id}/`);
  },
};

// Export the base API instance for custom requests
export { api };

// Log the current API configuration
console.log('API Configuration:', {
  baseURL: getApiBaseUrl(),
  currentHost: window.location.hostname,
  currentPort: window.location.port,
  fullURL: window.location.href
});
