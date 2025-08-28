# Douane Auction Viewer - Frontend

A modern React frontend for browsing Tunisian customs auction listings with a polished dark glassmorphism design.

## Features

- **Modern Dark Theme**: Beautiful glassmorphism design with gradients and blur effects
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Advanced Filtering**: Search by title, filter by type, brand, city, and price range
- **Real-time Search**: Debounced search with instant results
- **Card-based Layout**: Clean, visual listing cards with images and details
- **Admin Panel**: Secure admin interface for PDF upload and processing (hidden from regular users)
- **Statistics Dashboard**: Real-time stats showing total listings, brands, and cities

## Tech Stack

- **React 18**: Modern React with hooks and functional components
- **React Router**: Client-side routing and navigation
- **Axios**: HTTP client for API communication
- **Lucide React**: Beautiful, consistent icons
- **Custom CSS**: Modern glassmorphism design with CSS variables
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend Django server running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.js       # Navigation header
│   ├── ListingCard.js  # Individual listing card
│   └── SearchFilters.js # Search and filter controls
├── pages/              # Page components
│   ├── HomePage.js     # Main listings page
│   ├── ListingDetailPage.js # Individual listing details
│   └── AdminPage.js    # Admin dashboard
├── services/           # API and external services
│   └── api.js         # Centralized API client
└── App.js             # Main app component with routing
```

## API Integration

The frontend communicates with the Django backend through RESTful APIs:

- **Listings API**: Fetch, filter, and search auction listings
- **PDF Upload API**: Upload and process auction PDFs (admin only)
- **Statistics API**: Get real-time stats and filter options

## Key Features

### User Experience
- **Hero Section**: Eye-catching introduction with search bar and statistics
- **Smart Filters**: Collapsible sidebar with advanced filtering options
- **Loading States**: Smooth loading animations and skeleton cards
- **Error Handling**: Graceful error states with retry options
- **Responsive Design**: Optimized for all screen sizes

### Admin Access
The admin panel is hidden from regular users for security. To access admin features:

**Method 1: URL Parameter**
```
http://localhost:3000/?admin=true
```

**Method 2: Local Storage**
```javascript
localStorage.setItem('isAdmin', 'true')
```

**Method 3: Direct URL (will redirect if not admin)**
```
http://localhost:3000/admin
```

### Admin Features
- **PDF Upload**: Drag-and-drop file upload with validation
- **Processing Queue**: Monitor PDF processing status
- **Statistics Dashboard**: Real-time admin statistics
- **Secure Access**: Route guards prevent unauthorized access

## Styling

The app uses a custom dark glassmorphism theme with:

- **CSS Variables**: Consistent theming with `--accent-1`, `--accent-2`, etc.
- **Glass Effects**: Backdrop blur and transparency effects
- **Gradients**: Beautiful gradient backgrounds and buttons
- **Animations**: Smooth hover effects and transitions
- **Typography**: Modern font stack with proper hierarchy

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- Functional components with hooks
- Consistent naming conventions
- Modular CSS with BEM-like structure
- Responsive design patterns

## Deployment

The app is ready for deployment to platforms like:

- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **Railway**: Full-stack deployment
- **Heroku**: Traditional hosting

Build the production version:
```bash
npm run build
```

## Contributing

1. Follow the existing code style
2. Test on multiple screen sizes
3. Ensure admin features remain secure
4. Update documentation for new features

## License

This project is part of the Douane Auction Viewer system.
