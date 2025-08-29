import React, { useState, useEffect } from 'react';
import { 
  Upload, Settings, BarChart3, Users, Shield, FileText, 
  Clock, CheckCircle, AlertCircle, Eye, Edit, Trash2,
  Play, Pause, RefreshCw, Download, Image, Search,
  Plus, Filter, Grid, List, Save, X, ChevronDown, 
  UserCheck, UserX, Calendar, DollarSign, TrendingUp,
  Zap, Target, Database, Server, Activity, Bell
} from 'lucide-react';
import { listingsAPI, pdfUploadsAPI, api } from '../services/api';
import './AdminPage.css';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [pdfUploads, setPdfUploads] = useState([]);
  const [uploadsCount, setUploadsCount] = useState(0);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingLogs, setProcessingLogs] = useState([]);
  const [extractedItems, setExtractedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [editingListing, setEditingListing] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [jsonUploadFor, setJsonUploadFor] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [showTxtModal, setShowTxtModal] = useState(false);
  const [txtContent, setTxtContent] = useState('');
  const [txtTitle, setTxtTitle] = useState('');
  const [apiStatus, setApiStatus] = useState('unknown');

  useEffect(() => {
    fetchDashboardData();
    testAPIConnectivity();
  }, []);

  const testAPIConnectivity = async () => {
    try {
      const apiBase = api.defaults.baseURL;
      const response = await fetch(`${apiBase}/api/listings/stats/`, { mode: 'cors' });
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('API connectivity test failed:', error);
      setApiStatus('unreachable');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsResp, uploadsResp, listingsResp] = await Promise.all([
        listingsAPI.getStats(),
        pdfUploadsAPI.getPDFUploads(),
        listingsAPI.getAdminListings() // Get all listings for admin view without pagination
      ]);

      console.log('Stats response:', statsResp);
      console.log('Uploads response:', uploadsResp);
      console.log('Listings response:', listingsResp);

      // Handle stats
      const statsData = statsResp.data || {};
      setStats(statsData);

      // Handle uploads - check for different response structures
      let uploadsData = [];
      if (uploadsResp.data) {
        if (Array.isArray(uploadsResp.data)) {
          uploadsData = uploadsResp.data;
        } else if (uploadsResp.data.results) {
          uploadsData = uploadsResp.data.results;
        } else if (uploadsResp.data.uploads) {
          uploadsData = uploadsResp.data.uploads;
        }
      }
      setPdfUploads(uploadsData);
      
      // Set uploads count - use the actual count from stats if available
      const totalUploadsCount = statsData.total_uploads_count || uploadsData.length;
      setUploadsCount(totalUploadsCount);

      // Handle listings - check for different response structures
      let listingsData = [];
      if (listingsResp.data) {
        if (Array.isArray(listingsResp.data)) {
          listingsData = listingsResp.data;
        } else if (listingsResp.data.results) {
          listingsData = listingsResp.data.results;
        } else if (listingsResp.data.listings) {
          listingsData = listingsResp.data.listings;
        }
      }
      setListings(listingsData);

      // Set mock data for jobs and users since they might not exist yet
      setJobs([
        {
          id: 1,
          type: 'pdf_processing',
          status: 'completed',
          filename: 'Sample PDF',
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          logs: ['Processing completed successfully!']
        }
      ]);
      
      setUsers([
        {
          id: 1,
          username: 'admin',
          role: 'admin',
          email: 'admin@cardouane.tn',
          last_login: new Date().toISOString(),
          status: 'active',
          permissions: ['upload_pdf', 'process_listings', 'manage_users', 'view_logs']
        }
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Set some default data if API fails
      setStats({ total_listings: 0, total_uploads_count: 0 });
      setPdfUploads([]);
      setListings([]);
      setJobs([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const uploadPDF = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('city', 'Tunis');
      formData.append('auction_date', new Date().toISOString().split('T')[0]);

      const response = await pdfUploadsAPI.uploadPDF(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      await processPDF(response.data.id);
      
      setSelectedFile(null);
      setUploadProgress(0);
      fetchDashboardData();
    } catch (err) {
      console.error('Error uploading PDF:', err);
      alert('Error uploading PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const processPDF = async (uploadId) => {
    try {
      setProcessing(true);
      setProcessingLogs([]);
      setExtractedItems([]);

      // Call backend endpoint to generate TXT in project root
      const res = await pdfUploadsAPI.extractTxt(uploadId);
        setProcessingLogs(prev => [...prev, {
        id: prev.length,
        message: `TXT saved at ${res.data.txt_path} (${res.data.size_bytes} bytes)`,
          timestamp: new Date().toISOString(),
        type: 'success'
      }]);
    } catch (err) {
      console.error('Error processing PDF:', err);
      setProcessingLogs(prev => [...prev, {
        id: prev.length,
        message: 'Error processing PDF: ' + (err?.response?.data?.message || err.message),
        timestamp: new Date().toISOString(),
        type: 'error'
      }]);
    } finally {
      setProcessing(false);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(extractedItems.map(item => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItems([]);
  };

  const selectByCategory = (category) => {
    const categoryItems = extractedItems.filter(item => item.type === category);
    setSelectedItems(categoryItems.map(item => item.id));
  };

  const autoSuggestImages = () => {
    // Simulate auto image suggestion
    setExtractedItems(prev => prev.map(item => ({
      ...item,
      image_suggested: `https://via.placeholder.com/150x100?text=${encodeURIComponent(item.title)}`
    })));
  };

  const markDuplicates = () => {
    // Simulate duplicate detection
    setExtractedItems(prev => prev.map(item => ({
      ...item,
      duplicate: Math.random() > 0.7 // Randomly mark some as duplicates
    })));
  };

  const publishListings = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to publish.');
      return;
    }

    try {
      // Simulate publishing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully published ${selectedItems.length} listings!`);
      setExtractedItems([]);
      setSelectedItems([]);
      setProcessingLogs([]);
      fetchDashboardData();
    } catch (err) {
      console.error('Error publishing listings:', err);
      alert('Error publishing listings. Please try again.');
    }
  };

  const editListing = (listing) => {
    setEditingListing({ ...listing });
  };

  const saveListing = async () => {
    try {
      if (!editingListing) return;
      const payload = {
        title: editingListing.title,
        short_description: editingListing.short_description,
        full_description: editingListing.full_description,
        image_url: editingListing.image_url,
        brand: editingListing.brand,
        model: editingListing.model,
        year: editingListing.year,
        fuel_type: editingListing.fuel_type,
        starting_price: editingListing.starting_price,
        guarantee_amount: editingListing.guarantee_amount,
        serial_number: editingListing.serial_number,
        deadline: editingListing.deadline,
      };
      await listingsAPI.updateListing(editingListing.id, payload);
      setListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, ...payload } : l));
      setEditingListing(null);
      alert('Listing saved successfully!');
    } catch (err) {
      console.error('Error saving listing:', err);
      alert('Error saving listing. Please try again.');
    }
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Delete this listing? This action cannot be undone.')) return;
    try {
      await listingsAPI.deleteListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('Failed to delete listing');
    }
  };

  const deleteListingsByDateRange = async (startDate, endDate) => {
    try {
      // Filter listings within the date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const listingsToDelete = listings.filter(listing => {
        const listingDate = new Date(listing.created_at || listing.updated_at);
        return listingDate >= start && listingDate <= end;
      });

      if (listingsToDelete.length === 0) {
        alert('No listings found in the specified date range.');
        return;
      }

      // eslint-disable-next-line no-restricted-globals
      if (confirm(`Found ${listingsToDelete.length} listings to delete. Are you sure you want to proceed?`)) {
        // Delete each listing
        for (const listing of listingsToDelete) {
          try {
            await listingsAPI.deleteListing(listing.id);
          } catch (err) {
            console.error(`Error deleting listing ${listing.id}:`, err);
          }
        }
        
        // Refresh the listings
        await fetchDashboardData();
        alert(`Successfully deleted ${listingsToDelete.length} listings.`);
      }
    } catch (err) {
      console.error('Error deleting listings by date range:', err);
      alert('Error deleting listings by date range. Please try again.');
    }
  };

  const setDeadlinesByDateRange = async (startDate, endDate, deadlineDays) => {
    try {
      console.log('Setting deadlines for date range:', { startDate, endDate, deadlineDays });
      
      const response = await listingsAPI.setDeadlinesByDateRange({
        start_date: startDate,
        end_date: endDate,
        deadline_days: deadlineDays
      });
      
      console.log('Deadline response:', response.data);
      
      // Show debug info if available
      if (response.data.debug_info) {
        const debugInfo = response.data.debug_info;
        const debugMessage = `Debug Info:
- Total listings: ${debugInfo.total_listings}
- Listings with auction dates: ${debugInfo.listings_with_auction_dates}
- Found in date range: ${debugInfo.found_in_date_range}
- Date range: ${debugInfo.date_range}`;
        console.log(debugMessage);
      }
      
      alert(response.data.message);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error setting deadlines:', err);
      if (err.response?.data?.error) {
        alert(`Error: ${err.response.data.error}`);
      } else {
        alert('Error setting deadlines. Please try again.');
      }
    }
  };

  const setDeadlinesByPdf = async (pdfUploadId, deadlineDays) => {
    try {
      console.log('Setting deadlines for PDF:', { pdfUploadId, deadlineDays });
      
      const response = await listingsAPI.setDeadlinesByPdf({
        pdf_upload_id: pdfUploadId,
        deadline_days: deadlineDays
      });
      
      console.log('PDF deadline response:', response.data);
      alert(response.data.message);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error setting deadlines by PDF:', err);
      if (err.response?.data?.error) {
        alert(`Error: ${err.response.data.error}`);
      } else {
        alert('Error setting deadlines by PDF. Please try again.');
      }
    }
  };

  const searchImages = async (query) => {
    // Simulate image search
    const suggestions = [
      `https://via.placeholder.com/300x200?text=${encodeURIComponent(query)}`,
      `https://via.placeholder.com/300x200?text=${encodeURIComponent(query)}+2`,
      `https://via.placeholder.com/300x200?text=${encodeURIComponent(query)}+3`,
    ];
    setImageSuggestions(suggestions);
    setShowImageModal(true);
  };

  const openTxtModal = async (upload) => {
    try {
      const res = await pdfUploadsAPI.getTxt(upload.id);
      setTxtContent(res.data.txt || '');
      setTxtTitle(upload.filename);
      setShowTxtModal(true);
    } catch (err) {
      alert('TXT not found. Please extract TXT first.');
    }
  };

  const getStats = () => {
    // Use actual data from state, with fallbacks
    const actualStats = {
      total_listings: stats.total_listings || listings.length || 0,
      pending_uploads: Array.isArray(pdfUploads) ? pdfUploads.filter(upload => !upload.processed).length : 0,
      processed_uploads: Array.isArray(pdfUploads) ? pdfUploads.filter(upload => upload.processed).length : 0,
      total_uploads: uploadsCount || (Array.isArray(pdfUploads) ? pdfUploads.length : 0),
      recent_activity: Array.isArray(listings) ? listings.length : 0,
      pending_jobs: Array.isArray(jobs) ? jobs.filter(job => job.status === 'running' || job.status === 'pending').length : 0,
      failed_jobs: Array.isArray(jobs) ? jobs.filter(job => job.status === 'failed').length : 0,
      active_users: Array.isArray(users) ? users.filter(user => user.status === 'active').length : 0
    };

    console.log('Calculated stats:', actualStats);
    return actualStats;
  };

  const statsData = getStats();

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Admin Header */}
      <section className="admin-hero">
        <div className="container">
          <div className="admin-hero-content">
            <div className="admin-hero-text">
              <h1>Admin Dashboard</h1>
              <p>Manage PDF uploads, process OCR data, and review auction listings</p>
              <div className="admin-badge">
                <Shield size={16} />
                <span>Administrator Access</span>
              </div>
            </div>
            <div className="admin-hero-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('upload')}
              >
                <Upload size={20} />
                Upload PDF
              </button>
              <button 
                className="btn btn-outline"
                onClick={fetchDashboardData}
                disabled={loading}
              >
                <RefreshCw size={20} className={loading ? 'spinning' : ''} />
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon success">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{statsData.total_listings}</div>
                <div className="stat-label">Total Listings</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon warning">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{statsData.pending_jobs}</div>
                <div className="stat-label">Pending Jobs</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon success">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{statsData.processed_uploads}</div>
                <div className="stat-label">Processed Uploads</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon info">
                <BarChart3 size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{statsData.recent_activity}</div>
                <div className="stat-label">Recent Activity</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon danger">
                <AlertCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{statsData.failed_jobs}</div>
                <div className="stat-label">Failed Jobs</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon primary">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{statsData.active_users}</div>
                <div className="stat-label">Active Users</div>
              </div>
            </div>
          </div>

          {/* Debug Section - Remove this in production */}
          <div className="card" style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)' }}>
            <h4 style={{ color: 'red', marginBottom: '1rem' }}>Debug Info (Remove in production)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem' }}>
              <div>
                <strong>API Status:</strong>
                <br />
                <span style={{ color: 'green' }}>✓ Frontend loaded</span>
                <br />
                <span style={{ color: loading ? 'orange' : 'green' }}>
                  {loading ? '⏳ Loading...' : '✓ Data loaded'}
                </span>
                <br />
                <strong>API Base URL:</strong> {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`}
                <br />
                <strong>API Connectivity:</strong>
                <span style={{ color: apiStatus === 'connected' ? 'green' : apiStatus === 'error' ? 'red' : 'orange' }}>
                  {apiStatus}
                </span>
              </div>
              <div>
                <strong>Raw Stats:</strong>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
                  {JSON.stringify(stats, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Listings Count:</strong> {Array.isArray(listings) ? listings.length : 'Not array'}
                <br />
                <strong>Uploads Count:</strong> {Array.isArray(pdfUploads) ? pdfUploads.length : 'Not array'}
                <br />
                <strong>Calculated Stats:</strong>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
                  {JSON.stringify(statsData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="admin-main">
        <div className="container">
          {/* Tab Navigation */}
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 size={18} />
              Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={18} />
              Upload & Process
            </button>
            <button 
              className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
              onClick={() => setActiveTab('uploads')}
            >
              <FileText size={18} />
              PDF Uploads
            </button>
            <button 
              className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
              onClick={() => setActiveTab('listings')}
            >
              <Eye size={18} />
              Review Listings
            </button>
            <button 
              className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              <Activity size={18} />
              Jobs & Logs
            </button>
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={18} />
              Users & Roles
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="dashboard-content">
                <div className="dashboard-grid">
                  <div className="dashboard-card">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions">
                      <button className="action-btn" onClick={() => setActiveTab('upload')}>
                        <Upload size={20} />
                        Upload PDF
                      </button>
                      <button className="action-btn" onClick={() => setActiveTab('uploads')}>
                        <FileText size={20} />
                        View Uploads
                      </button>
                      <button className="action-btn" onClick={() => setActiveTab('listings')}>
                        <Eye size={20} />
                        Review Listings
                      </button>
                      <button className="action-btn" onClick={() => setActiveTab('jobs')}>
                        <Activity size={20} />
                        View Jobs
                      </button>
                    </div>
                  </div>
                  
                  <div className="dashboard-card">
                    <h3>Recent Uploads</h3>
                    <div className="recent-uploads">
                      {Array.isArray(pdfUploads) && pdfUploads.length > 0 ? pdfUploads.slice(0, 5).map((upload) => (
                        <div key={upload.id} className="upload-item">
                          <div className="upload-info">
                            <div className="upload-name">{upload.filename}</div>
                            <div className="upload-meta">
                              {upload.city} • {new Date(upload.auction_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`status-badge ${upload.processed ? 'success' : 'pending'}`}>
                            {upload.processed ? 'Processed' : 'Pending'}
                          </div>
                        </div>
                      )) : <div className="empty-state">No uploads yet</div>}
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h3>Recent Jobs</h3>
                    <div className="recent-jobs">
                      {Array.isArray(jobs) && jobs.length > 0 ? jobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="job-item">
                          <div className="job-info">
                            <div className="job-name">{job.filename}</div>
                            <div className="job-meta">
                              {job.type} • {new Date(job.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`status-badge ${job.status}`}>
                            {job.status}
                          </div>
                        </div>
                      )) : <div className="empty-state">No jobs yet</div>}
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h3>System Status</h3>
                    <div className="system-status">
                      <div className="status-item">
                        <div className="status-label">OCR Service</div>
                        <div className="status-value online">Online</div>
                      </div>
                      <div className="status-item">
                        <div className="status-label">Database</div>
                        <div className="status-value online">Online</div>
                      </div>
                      <div className="status-item">
                        <div className="status-label">Image Search</div>
                        <div className="status-value online">Online</div>
                      </div>
                      <div className="status-item">
                        <div className="status-label">Queue Workers</div>
                        <div className="status-value warning">2/3 Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload & Process Tab */}
            {activeTab === 'upload' && (
              <div className="upload-content">
                <div className="upload-section">
                  <h3>Upload PDF File</h3>
                  <div 
                    className="upload-area"
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                  >
                    {selectedFile ? (
                      <div className="file-selected">
                        <FileText size={48} />
                        <div className="file-info">
                          <div className="file-name">{selectedFile.name}</div>
                          <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <button className="btn btn-outline" onClick={() => setSelectedFile(null)}>
                          <X size={16} />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="upload-prompt">
                        <Upload size={48} />
                        <h4>Drop PDF file here or click to browse</h4>
                        <p>Supports PDF files up to 10MB</p>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="file-input"
                        />
                      </div>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="upload-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={uploadPDF}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <RefreshCw size={16} className="spinning" />
                            Uploading... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Upload & Process
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Processing Section */}
                {processing && (
                  <div className="processing-section">
                    <h3>Processing PDF</h3>
                    <div className="processing-status">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(processingLogs.length / 9) * 100}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        Step {processingLogs.length} of 9
                      </div>
                    </div>
                    
                    <div className="processing-logs">
                      {processingLogs.map((log) => (
                        <div key={log.id} className={`log-entry ${log.type}`}>
                          <div className="log-icon">
                            {log.type === 'success' && <CheckCircle size={16} />}
                            {log.type === 'error' && <AlertCircle size={16} />}
                            {log.type === 'info' && <Clock size={16} />}
                          </div>
                          <div className="log-message">{log.message}</div>
                          <div className="log-time">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Items */}
                {extractedItems.length > 0 && (
                  <div className="extracted-items-section">
                    <div className="section-header">
                      <h3>Extracted Items ({extractedItems.length})</h3>
                      <div className="section-actions">
                        <button className="btn btn-outline" onClick={selectAllItems}>
                          Select All
                        </button>
                        <button className="btn btn-outline" onClick={deselectAllItems}>
                          Deselect All
                        </button>
                        <button className="btn btn-outline" onClick={() => selectByCategory('vehicle')}>
                          Select Vehicles
                        </button>
                        <button className="btn btn-outline" onClick={autoSuggestImages}>
                          Auto-Suggest Images
                        </button>
                        <button className="btn btn-outline" onClick={markDuplicates}>
                          Mark Duplicates
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={publishListings}
                          disabled={selectedItems.length === 0}
                        >
                          <Save size={16} />
                          Publish Selected ({selectedItems.length})
                        </button>
                      </div>
                    </div>

                    <div className={`items-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                      {extractedItems.map((item) => (
                        <div key={item.id} className={`extracted-item ${item.duplicate ? 'duplicate' : ''}`}>
                          <div className="item-header">
                            <label className="item-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={() => toggleItemSelection(item.id)}
                              />
                              <span className="checkmark"></span>
                            </label>
                            <div className="item-confidence">
                              {Math.round(item.confidence * 100)}%
                            </div>
                            {item.duplicate && (
                              <div className="duplicate-badge">Duplicate</div>
                            )}
                          </div>
                          
                          <div className="item-image">
                            <img src={item.image_suggested} alt={item.title} />
                            <button 
                              className="image-suggest-btn"
                              onClick={() => searchImages(item.title)}
                            >
                              <Image size={16} />
                            </button>
                          </div>
                          
                          <div className="item-content">
                            <h4 className="item-title">{item.title}</h4>
                            <div className="item-meta">
                              <span className="item-type">{item.type}</span>
                              <span className="item-price">{item.price}</span>
                            </div>
                            {item.brand && (
                              <div className="item-details">
                                <span>{item.brand} {item.model}</span>
                                {item.year && <span>{item.year}</span>}
                                {item.fuel_type && <span>{item.fuel_type}</span>}
                              </div>
                            )}
                            <div className="item-guarantee">
                              Guarantee: {item.guarantee}
                            </div>
                          </div>
                          
                          <div className="item-actions">
                            <button className="action-btn">
                              <Edit size={16} />
                            </button>
                            <button className="action-btn">
                              <Search size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PDF Uploads Tab */}
            {activeTab === 'uploads' && (
              <div className="uploads-content">
                <div className="section-header">
                  <h3>PDF Uploads ({uploadsCount})</h3>
                  <div className="section-actions">
                    <button className="btn btn-outline">
                      <Filter size={16} />
                      Filter
                    </button>
                    <button className="btn btn-outline">
                      <Download size={16} />
                      Export
                    </button>
                  </div>
                </div>

                {/* JSON Import Panel - Always Visible */}
                <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Import Listings JSON</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={jsonUploadFor || ''}
                      onChange={(e) => setJsonUploadFor(e.target.value ? Number(e.target.value) : null)}
                      className="sort-select"
                    >
                      <option value="">Select PDF upload...</option>
                      {Array.isArray(pdfUploads) && pdfUploads.map(u => (
                        <option key={u.id} value={u.id}>{u.filename}</option>
                      ))}
                    </select>

                    <button
                      className="btn btn-outline"
                      disabled={!jsonUploadFor}
                      onClick={() => {
                        const selected = pdfUploads.find(u => u.id === jsonUploadFor);
                        if (selected) openTxtModal(selected);
                      }}
                    >
                      <Eye size={16} /> View TXT
                    </button>

                    <button
                      className="btn btn-outline"
                      disabled={!jsonUploadFor}
                      onClick={() => jsonUploadFor && processPDF(jsonUploadFor)}
                    >
                      <RefreshCw size={16} /> Extract TXT
                    </button>

                    <label className="btn btn-outline" style={{ marginRight: '0.5rem' }}>
                      <Upload size={16} /> Choose JSON File
                      <input
                        type="file"
                        accept="application/json"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file) setJsonFile(file);
                        }}
                      />
                    </label>

                    <button
                      className="btn btn-primary"
                      disabled={!jsonUploadFor || !jsonFile}
                      onClick={async () => {
                        try {
                          await pdfUploadsAPI.importJson(jsonUploadFor, jsonFile);
                          setJsonFile(null);
                          fetchDashboardData();
                          alert('JSON imported successfully');
                        } catch (err) {
                          console.error(err);
                          alert('Failed to import JSON');
                        }
                      }}
                    >
                      <Save size={16} /> Import JSON
                    </button>
                  </div>

                  {/* Import JSON without PDF */}
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="text-muted">Or import JSON without a PDF:</span>
                    <input type="text" placeholder="City (optional)" className="form-input" style={{ maxWidth: 180 }} id="jsonOnlyCity" />
                    <input type="date" placeholder="Auction date (YYYY-MM-DD)" className="form-input" style={{ maxWidth: 200 }} id="jsonOnlyDate" />
                    <label className="btn btn-outline">
                      <Upload size={16} /> Choose JSON File
                      <input
                        type="file"
                        accept="application/json"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file) setJsonFile(file);
                        }}
                      />
                    </label>
                    <button
                      className="btn btn-primary"
                      disabled={!jsonFile}
                      onClick={async () => {
                        try {
                          const cityEl = document.getElementById('jsonOnlyCity');
                          const dateEl = document.getElementById('jsonOnlyDate');
                          const extra = {
                            city: cityEl && cityEl.value ? cityEl.value : undefined,
                            auction_date: dateEl && dateEl.value ? dateEl.value : undefined,
                          };
                          await pdfUploadsAPI.importJsonNoPdf(jsonFile, extra);
                          setJsonFile(null);
                          fetchDashboardData();
                          alert('JSON imported without PDF successfully');
                        } catch (err) {
                          console.error(err);
                          alert('Failed to import JSON without PDF');
                        }
                      }}
                    >
                      <Save size={16} /> Import JSON Only
                    </button>
                  </div>
                </div>

                <div className="uploads-grid">
                  {Array.isArray(pdfUploads) && pdfUploads.length > 0 ? pdfUploads.map((upload) => (
                    <div key={upload.id} className="upload-card">
                      <div className="upload-header">
                        <div className="upload-icon">
                          <FileText size={24} />
                        </div>
                        <div className="upload-status">
                          <div className={`status-badge ${upload.processed ? 'success' : 'pending'}`}>
                            {upload.processed ? 'Processed' : 'Pending'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="upload-info">
                        <h4 className="upload-name">{upload.filename}</h4>
                        <div className="upload-meta">
                          <div className="meta-item">
                            <span className="meta-label">City:</span>
                            <span className="meta-value">{upload.city}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Date:</span>
                            <span className="meta-value">
                              {new Date(upload.auction_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Listings:</span>
                            <span className="meta-value">{upload.total_listings}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="upload-actions">
                        <button className="btn btn-outline" onClick={() => processPDF(upload.id)}>
                          <RefreshCw size={16} />
                          Extract TXT
                        </button>
                        <button className="btn btn-outline" onClick={() => openTxtModal(upload)}>
                          <Eye size={16} />
                          View TXT
                        </button>
                        <label className="btn btn-outline">
                          <Upload size={16} />
                          Import JSON
                          <input
                            type="file"
                            accept="application/json"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files && e.target.files[0];
                              if (file) {
                                setJsonUploadFor(upload.id);
                                setJsonFile(file);
                              }
                            }}
                          />
                        </label>
                        {(jsonUploadFor === upload.id && jsonFile) && (
                          <button
                            className="btn btn-primary"
                            onClick={async () => {
                              try {
                                await pdfUploadsAPI.importJson(upload.id, jsonFile);
                                setJsonUploadFor(null);
                                setJsonFile(null);
                                fetchDashboardData();
                                alert('JSON imported successfully');
                              } catch (err) {
                                console.error(err);
                                alert('Failed to import JSON');
                              }
                            }}
                          >
                            <Save size={16} /> Confirm Import
                          </button>
                        )}
                      </div>
                    </div>
                  )) : <div className="empty-state">No PDF uploads found</div>}
                </div>
              </div>
            )}

            {/* Review Listings Tab */}
            {activeTab === 'listings' && (
              <div className="listings-content">
                <div className="section-header">
                  <h3>Review Listings ({Array.isArray(listings) ? listings.length : 0})</h3>
                  <div className="section-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        console.log('Manual refresh of listings...');
                        fetchDashboardData();
                      }}
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                    <div className="view-toggle">
                      <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid size={16} />
                      </button>
                      <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                      >
                        <List size={16} />
                      </button>
                    </div>
                    <button className="btn btn-outline">
                      <Filter size={16} />
                      Filter
                    </button>
                    <button 
                      className="btn btn-outline danger"
                      onClick={() => {
                        const startDate = prompt('Enter start date (YYYY-MM-DD):');
                        const endDate = prompt('Enter end date (YYYY-MM-DD):');
                        if (startDate && endDate) {
                          // eslint-disable-next-line no-restricted-globals
                        if (confirm(`Are you sure you want to delete all listings between ${startDate} and ${endDate}?`)) {
                            deleteListingsByDateRange(startDate, endDate);
                          }
                        }
                      }}
                    >
                      <Trash2 size={16} />
                      Delete by Date Range
                    </button>
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        const startDate = prompt('Enter start date (YYYY-MM-DD):');
                        const endDate = prompt('Enter end date (YYYY-MM-DD):');
                        const deadlineDays = prompt('Enter deadline days from now (default 30):', '30');
                        if (startDate && endDate) {
                          const days = parseInt(deadlineDays) || 30;
                          // eslint-disable-next-line no-restricted-globals
                          if (confirm(`Set ${days}-day deadline for all listings between ${startDate} and ${endDate}?`)) {
                            setDeadlinesByDateRange(startDate, endDate, days);
                          }
                        }
                      }}
                    >
                      <Clock size={16} />
                      Set Deadlines
                    </button>
                    <div className="btn-group">
                      <select 
                        className="btn btn-outline"
                        onChange={(e) => {
                          const selectedPdf = e.target.value;
                          if (selectedPdf) {
                            const deadlineDays = prompt('Enter deadline days from now (default 30):', '30');
                            if (deadlineDays) {
                              const days = parseInt(deadlineDays) || 30;
                              // eslint-disable-next-line no-restricted-globals
                              if (confirm(`Set ${days}-day deadline for all listings from the selected PDF?`)) {
                                setDeadlinesByPdf(selectedPdf, days);
                                // Reset the dropdown after use
                                e.target.value = '';
                              }
                            }
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">Select PDF to set deadlines...</option>
                        {Array.isArray(pdfUploads) && pdfUploads.map((upload) => (
                          <option key={upload.id} value={upload.id}>
                            {upload.filename} ({upload.city} - {upload.auction_date})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button 
                      className="btn btn-outline"
                      onClick={async () => {
                        try {
                          const response = await listingsAPI.debugListings();
                          console.log('Debug listings response:', response.data);
                          alert(`Debug info logged to console. Total listings: ${response.data.debug_info.total_listings}, With auction dates: ${response.data.debug_info.listings_with_auction_dates}`);
                        } catch (err) {
                          console.error('Error getting debug info:', err);
                          alert('Error getting debug info. Check console.');
                        }
                      }}
                    >
                      <Database size={16} />
                      Debug Listings
                    </button>
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        // Test with a very broad date range (last 10 years to next 10 years)
                        const startDate = '2014-01-01';
                        const endDate = '2034-12-31';
                        const deadlineDays = 30;
                        console.log('Testing deadline setting with broad date range:', { startDate, endDate, deadlineDays });
                        setDeadlinesByDateRange(startDate, endDate, deadlineDays);
                      }}
                    >
                      <Target size={16} />
                      Test Deadlines
                    </button>
                  </div>
                </div>

                <div className={`listings-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                  {Array.isArray(listings) && listings.length > 0 ? listings.map((listing) => (
                    <div key={listing.id} className="listing-review-card">
                      <div className="listing-image">
                        <img 
                          src={listing.image_url || 'https://via.placeholder.com/200x150?text=No+Image'} 
                          alt={listing.title}
                        />
                        <button 
                          className="image-suggest-btn"
                          onClick={() => searchImages(listing.title)}
                        >
                          <Image size={16} />
                        </button>
                      </div>
                      
                      <div className="listing-content">
                        {editingListing?.id === listing.id ? (
                          <div className="editing-form">
                            <div className="edit-grid">
                              <div className="edit-field">
                                <label>Title:</label>
                            <input
                              type="text"
                              value={editingListing.title}
                              onChange={(e) => setEditingListing(prev => ({ ...prev, title: e.target.value }))}
                              className="edit-input"
                            />
                              </div>
                              
                              <div className="edit-field">
                                <label>Short Description:</label>
                            <textarea
                              value={editingListing.short_description}
                              onChange={(e) => setEditingListing(prev => ({ ...prev, short_description: e.target.value }))}
                                  className="edit-textarea"
                                  rows={2}
                                />
                              </div>
                              
                              <div className="edit-field">
                                <label>Full Description:</label>
                                <textarea
                                  value={editingListing.full_description || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, full_description: e.target.value }))}
                              className="edit-textarea"
                              rows={3}
                            />
                              </div>
                              
                              <div className="edit-field">
                                <label>Image URL:</label>
                                <input
                                  type="text"
                                  value={editingListing.image_url || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, image_url: e.target.value }))}
                                  className="edit-input"
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>
                              
                              <div className="edit-field">
                                <label>Brand:</label>
                                <input
                                  type="text"
                                  value={editingListing.brand || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, brand: e.target.value }))}
                                  className="edit-input"
                                />
                              </div>
                              
                              <div className="edit-field">
                                <label>Model:</label>
                                <input
                                  type="text"
                                  value={editingListing.model || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, model: e.target.value }))}
                                  className="edit-input"
                                />
                              </div>
                              
                              <div className="edit-field">
                                <label>Year:</label>
                                <input
                                  type="text"
                                  value={editingListing.year || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, year: e.target.value }))}
                                  className="edit-input"
                                  placeholder="2020"
                                />
                              </div>
                              
                              <div className="edit-field">
                                <label>Fuel Type:</label>
                                <select
                                  value={editingListing.fuel_type || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, fuel_type: e.target.value }))}
                                  className="edit-select"
                                >
                                  <option value="">Select fuel type</option>
                                  <option value="essence">Essence</option>
                                  <option value="diesel">Diesel</option>
                                  <option value="electric">Electric</option>
                                  <option value="hybrid">Hybrid</option>
                                </select>
                              </div>
                              
                              <div className="edit-field">
                                <label>Starting Price (TND):</label>
                                <input
                                  type="number"
                                  value={editingListing.starting_price || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, starting_price: parseFloat(e.target.value) || 0 }))}
                                  className="edit-input"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              
                              <div className="edit-field">
                                <label>Guarantee Amount (TND):</label>
                                <input
                                  type="number"
                                  value={editingListing.guarantee_amount || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, guarantee_amount: parseFloat(e.target.value) || 0 }))}
                                  className="edit-input"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              
                              <div className="edit-field">
                                <label>Serial Number:</label>
                                <input
                                  type="text"
                                  value={editingListing.serial_number || ''}
                                  onChange={(e) => setEditingListing(prev => ({ ...prev, serial_number: e.target.value }))}
                                  className="edit-input"
                                />
                              </div>
                              
                              <div className="edit-field">
                                <label>Deadline:</label>
                                <input
                                  type="datetime-local"
                                  value={editingListing.deadline ? new Date(editingListing.deadline).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => setEditingListing(prev => ({ 
                                    ...prev, 
                                    deadline: e.target.value ? new Date(e.target.value).toISOString() : null 
                                  }))}
                                  className="edit-input"
                                />
                              </div>
                            </div>
                            
                            <div className="edit-actions">
                              <button className="btn btn-primary" onClick={saveListing}>
                                <Save size={16} />
                                Save Changes
                              </button>
                              <button className="btn btn-outline" onClick={() => setEditingListing(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                        <h4 className="listing-title">{listing.title}</h4>
                        <div className="listing-meta">
                          <span className="listing-type">{listing.listing_type}</span>
                          <span className="listing-price">{listing.formatted_price}</span>
                        </div>
                        <p className="listing-description">{listing.short_description}</p>
                            {listing.brand && (
                              <div className="listing-details">
                                <span className="detail-item">
                                  <strong>Brand:</strong> {listing.brand}
                                </span>
                                {listing.model && (
                                  <span className="detail-item">
                                    <strong>Model:</strong> {listing.model}
                                  </span>
                                )}
                                {listing.year && (
                                  <span className="detail-item">
                                    <strong>Year:</strong> {listing.year}
                                  </span>
                                )}
                                {listing.fuel_type && (
                                  <span className="detail-item">
                                    <strong>Fuel:</strong> {listing.fuel_type}
                                  </span>
                                )}
                                {listing.deadline && (
                                  <span className={`detail-item deadline-display deadline-${listing.deadline_status || 'normal'}`}>
                                    <strong>Deadline:</strong> {new Date(listing.deadline).toLocaleString()}
                                    {listing.is_expired && <span className="expired-badge">EXPIRED</span>}
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="listing-actions">
                        <button 
                          className="btn btn-outline"
                          onClick={() => editListing(listing)}
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button className="btn btn-outline">
                          <Eye size={16} />
                          Preview
                        </button>
                        <button className="btn btn-outline danger" onClick={() => deleteListing(listing.id)}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )) : <div className="empty-state">No listings found</div>}
                </div>
              </div>
            )}

            {/* Jobs & Logs Tab */}
            {activeTab === 'jobs' && (
              <div className="jobs-content">
                <div className="section-header">
                  <h3>Jobs & Logs ({Array.isArray(jobs) ? jobs.length : 0})</h3>
                  <div className="section-actions">
                    <button className="btn btn-outline">
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                    <button className="btn btn-outline">
                      <Download size={16} />
                      Export Logs
                    </button>
                  </div>
                </div>

                <div className="jobs-table">
                  <div className="table-header">
                    <div className="table-cell">Job ID</div>
                    <div className="table-cell">Type</div>
                    <div className="table-cell">Filename</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Created</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  {Array.isArray(jobs) && jobs.length > 0 ? jobs.map((job) => (
                    <div key={job.id} className="table-row">
                      <div className="table-cell">#{job.id}</div>
                      <div className="table-cell">{job.type}</div>
                      <div className="table-cell">{job.filename}</div>
                      <div className="table-cell">
                        <div className={`status-badge ${job.status}`}>
                          {job.status}
                        </div>
                      </div>
                      <div className="table-cell">
                        {new Date(job.created_at).toLocaleDateString()}
                      </div>
                      <div className="table-cell">
                        <div className="job-actions">
                          <button className="action-btn">
                            <Eye size={16} />
                          </button>
                          {job.status === 'failed' && (
                            <button className="action-btn">
                              <RefreshCw size={16} />
                            </button>
                          )}
                          <button className="action-btn">
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : <div className="empty-state">No jobs found</div>}
                </div>
              </div>
            )}

            {/* Users & Roles Tab */}
            {activeTab === 'users' && (
              <div className="users-content">
                <div className="section-header">
                  <h3>Users & Roles ({Array.isArray(users) ? users.length : 0})</h3>
                  <div className="section-actions">
                    <button className="btn btn-primary">
                      <Plus size={16} />
                      Add User
                    </button>
                    <button className="btn btn-outline">
                      <Download size={16} />
                      Export
                    </button>
                  </div>
                </div>

                <div className="users-table">
                  <div className="table-header">
                    <div className="table-cell">Username</div>
                    <div className="table-cell">Role</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Last Login</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  {Array.isArray(users) && users.length > 0 ? users.map((user) => (
                    <div key={user.id} className="table-row">
                      <div className="table-cell">{user.username}</div>
                      <div className="table-cell">
                        <div className={`role-badge ${user.role}`}>
                          {user.role}
                        </div>
                      </div>
                      <div className="table-cell">
                        <div className={`status-badge ${user.status}`}>
                          {user.status}
                        </div>
                      </div>
                      <div className="table-cell">
                        {new Date(user.last_login).toLocaleDateString()}
                      </div>
                      <div className="table-cell">
                        <div className="user-actions">
                          <button className="action-btn">
                            <Edit size={16} />
                          </button>
                          <button className="action-btn">
                            {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          <button className="action-btn danger">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : <div className="empty-state">No users found</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Suggestions Modal */}
      {showImageModal && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Image Suggestions</h3>
              <button 
                className="modal-close"
                onClick={() => setShowImageModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="image-suggestions">
                {imageSuggestions.map((image, index) => (
                  <div key={index} className="image-suggestion">
                    <img src={image} alt={`Suggestion ${index + 1}`} />
                    <div className="image-actions">
                      <button className="btn btn-primary">Use This</button>
                      <button className="btn btn-outline">Search More</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TXT Modal */}
      {showTxtModal && (
        <div className="modal-overlay" onClick={() => setShowTxtModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>TXT Preview - {txtTitle}</h3>
              <button className="modal-close" onClick={() => setShowTxtModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>{txtContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
