// Demo script for testing admin features
// Run this in the browser console to enable admin access and set up demo data

console.log('🚀 Setting up Car Douane Admin Demo...');

// Enable admin access
localStorage.setItem('isAdmin', 'true');
localStorage.setItem('isLoggedIn', 'true');

// Set up demo user data
const demoUser = {
  id: 1,
  username: 'admin',
  role: 'admin',
  email: 'admin@cardouane.tn',
  permissions: ['upload_pdf', 'process_listings', 'manage_users', 'view_logs']
};
localStorage.setItem('demoUser', JSON.stringify(demoUser));

// Mock API responses for demo
window.mockAPI = {
  stats: {
    total_listings: 1247,
    pending_uploads: 3,
    processed_uploads: 28,
    total_uploads: 31,
    recent_activity: 15,
    pending_jobs: 2,
    failed_jobs: 1,
    active_users: 8
  },
  
  pdfUploads: [
    {
      id: 1,
      filename: '2025-08-07_AV_OP_Kef_N°03-2025.pdf',
      city: 'Kef',
      auction_date: '2025-08-07',
      uploaded_at: '2025-01-15T10:30:00Z',
      processed: true,
      total_listings: 45
    },
    {
      id: 2,
      filename: '2025-08-07_AV_OP_Sidi-Bouzid_N°09-2025.pdf',
      city: 'Sidi Bouzid',
      auction_date: '2025-08-07',
      uploaded_at: '2025-01-15T11:15:00Z',
      processed: false,
      total_listings: 0
    },
    {
      id: 3,
      filename: '2025-01-10_AV_OP_Tunis_N°15-2025.pdf',
      city: 'Tunis',
      auction_date: '2025-01-10',
      uploaded_at: '2025-01-10T14:20:00Z',
      processed: true,
      total_listings: 67
    }
  ],
  
  listings: [
    {
      id: 1,
      lot_number: '001',
      title: 'Mercedes C220 2010',
      listing_type: 'vehicle',
      brand: 'Mercedes',
      model: 'C220',
      year: 2010,
      fuel_type: 'diesel',
      starting_price: 15000.00,
      guarantee_amount: 1500.00,
      short_description: 'Mercedes C220, 2010, Diesel, Good condition',
      full_description: 'Mercedes-Benz C220 CDI, 2010 model, diesel engine, automatic transmission, leather interior, well maintained, auction lot #001',
      image_url: 'https://via.placeholder.com/300x200?text=Mercedes+C220',
      created_at: '2025-01-15T10:30:00Z'
    },
    {
      id: 2,
      lot_number: '002',
      title: 'Renault Clio 2015',
      listing_type: 'vehicle',
      brand: 'Renault',
      model: 'Clio',
      year: 2015,
      fuel_type: 'petrol',
      starting_price: 12500.00,
      guarantee_amount: 1250.00,
      short_description: 'Renault Clio, 2015, Petrol, Excellent condition',
      full_description: 'Renault Clio, 2015 model, petrol engine, manual transmission, low mileage, excellent condition, auction lot #002',
      image_url: 'https://via.placeholder.com/300x200?text=Renault+Clio',
      created_at: '2025-01-15T10:35:00Z'
    },
    {
      id: 3,
      lot_number: '003',
      title: 'Industrial Generator 50kW',
      listing_type: 'goods',
      brand: '',
      model: '',
      year: null,
      fuel_type: '',
      starting_price: 8000.00,
      guarantee_amount: 800.00,
      short_description: 'Industrial Generator, 50kW capacity, Used equipment',
      full_description: 'Industrial generator with 50kW capacity, diesel powered, used condition, suitable for backup power, auction lot #003',
      image_url: 'https://via.placeholder.com/300x200?text=Generator',
      created_at: '2025-01-15T10:40:00Z'
    }
  ],
  
  jobs: [
    {
      id: 1,
      type: 'pdf_processing',
      status: 'completed',
      filename: '2025-08-07_AV_OP_Kef_N°03-2025.pdf',
      created_at: '2025-01-15T10:30:00Z',
      completed_at: '2025-01-15T10:45:00Z',
      logs: [
        'Starting PDF processing...',
        'Extracting text content...',
        'Identifying table structures...',
        'Parsing auction listings...',
        'Processing completed successfully!'
      ]
    },
    {
      id: 2,
      type: 'image_search',
      status: 'running',
      filename: '2025-08-07_AV_OP_Sidi-Bouzid_N°09-2025.pdf',
      created_at: '2025-01-15T11:00:00Z',
      logs: [
        'Starting image search...',
        'Searching for vehicle images...',
        'Processing image results...'
      ]
    },
    {
      id: 3,
      type: 'pdf_processing',
      status: 'failed',
      filename: 'corrupted.pdf',
      created_at: '2025-01-15T09:15:00Z',
      error: 'PDF file is corrupted or password protected'
    }
  ],
  
  users: [
    {
      id: 1,
      username: 'admin',
      role: 'admin',
      email: 'admin@cardouane.tn',
      last_login: '2025-01-15T12:00:00Z',
      status: 'active',
      permissions: ['upload_pdf', 'process_listings', 'manage_users', 'view_logs']
    },
    {
      id: 2,
      username: 'moderator1',
      role: 'moderator',
      email: 'moderator1@cardouane.tn',
      last_login: '2025-01-14T15:30:00Z',
      status: 'active',
      permissions: ['upload_pdf', 'process_listings', 'view_logs']
    },
    {
      id: 3,
      username: 'auditor1',
      role: 'auditor',
      email: 'auditor1@cardouane.tn',
      last_login: '2025-01-13T09:45:00Z',
      status: 'inactive',
      permissions: ['view_logs']
    }
  ]
};

// Override API calls to return mock data
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      let mockResponse;
      
      if (url.includes('/api/listings/stats/')) {
        mockResponse = { data: window.mockAPI.stats };
      } else if (url.includes('/api/pdf-uploads/')) {
        mockResponse = { data: window.mockAPI.pdfUploads };
      } else if (url.includes('/api/listings/')) {
        mockResponse = { data: window.mockAPI.listings };
      } else if (url.includes('/api/jobs/')) {
        mockResponse = { data: window.mockAPI.jobs };
      } else if (url.includes('/api/users/')) {
        mockResponse = { data: window.mockAPI.users };
      } else {
        // Fallback to original fetch
        return originalFetch.apply(this, arguments);
      }
      
      resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        data: mockResponse
      });
    }, 500); // Simulate network delay
  });
};

// Add demo notification
const notification = document.createElement('div');
notification.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 300px;
`;
notification.innerHTML = `
  <div style="font-weight: 600; margin-bottom: 0.5rem;">🎉 Admin Demo Enabled!</div>
  <div style="font-size: 0.9rem; opacity: 0.9;">
    • Admin access granted<br>
    • Mock data loaded<br>
    • API responses simulated<br>
    <br>
    <a href="/admin" style="color: #fff; text-decoration: underline;">Go to Admin Dashboard</a>
  </div>
`;

document.body.appendChild(notification);

// Auto-remove notification after 5 seconds
setTimeout(() => {
  if (notification.parentNode) {
    notification.parentNode.removeChild(notification);
  }
}, 5000);

console.log('✅ Admin demo setup complete!');
console.log('📊 Mock data available:', window.mockAPI);
console.log('🔗 Visit /admin to access the dashboard');
