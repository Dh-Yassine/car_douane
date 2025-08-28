# Car Douane - Auction Viewer

A modern web application for viewing and managing Tunisian Douane auction listings with OCR-powered PDF processing.

## 🚀 Features

### Search Page
- **Dedicated search results** with filters panel visible by default on desktop
- **Search chips** showing active filters with easy removal
- **Save search functionality** for logged-in users
- **Advanced filtering** by type, brand, city, price range, year, and fuel type
- **Multiple view modes** (grid/list) and sorting options
- **Responsive design** with mobile-optimized filters
- **Real-time search** with debounced input

### Admin Dashboard
- **Summary widgets** showing key metrics (pending jobs, total listings, etc.)
- **Quick actions** for common tasks
- **PDF Upload workflow** with drag & drop support
- **Live processing logs** with progress tracking
- **Extracted items preview** with confidence scores
- **Bulk actions** (select all, auto-suggest images, mark duplicates)
- **Review listings** with inline editing
- **Jobs & Logs** management
- **User & Roles** management

### Core Features
- **OCR-powered PDF processing** for auction documents
- **Multi-language support** (Arabic, French, English)
- **Image suggestion** integration
- **Real-time data** with API integration
- **Modern UI** with glassmorphism design
- **Responsive layout** for all devices

## 🛠️ Technology Stack

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Lucide React** for icons
- **CSS3** with custom properties and glassmorphism effects
- **Axios** for API communication

### Backend
- **Django 4.2** with REST framework
- **PostgreSQL** database
- **Celery** for background tasks
- **Redis** for caching and message broker
- **OCR processing** with Tesseract and OpenCV

### OCR & Processing
- **PDF parsing** with pdfplumber and camelot
- **Image processing** with OpenCV and PIL
- **Text extraction** with Tesseract OCR
- **Table detection** and extraction
- **Multi-language OCR** support

## 📁 Project Structure

```
Car_Douane/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.js          # Main application
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                # Django backend application
│   ├── douane_project/     # Django project settings
│   ├── listings/          # Listings app
│   ├── ocr_parser/        # OCR processing app
│   ├── manage.py          # Django management
│   └── requirements.txt   # Python dependencies
├── tying_Ocr.py           # OCR processing pipeline
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- PostgreSQL
- Redis
- Tesseract OCR

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Demo Mode
To test the admin features:
1. Open browser console
2. Run the demo script: `copy(await fetch('/demo-admin.js').then(r => r.text()))`
3. Paste and execute in console
4. Visit `/admin` to access the dashboard

## 📊 Admin Features

### Dashboard Overview
- **Total Listings**: Current count of all auction listings
- **Pending Jobs**: Number of processing jobs in queue
- **Processed Uploads**: Successfully processed PDF files
- **Recent Activity**: Latest system activity
- **Failed Jobs**: Jobs that encountered errors
- **Active Users**: Currently active system users

### PDF Upload & Processing
1. **Drag & Drop** PDF files or click to browse
2. **Automatic processing** with live progress tracking
3. **Extracted items preview** with confidence scores
4. **Bulk selection** and actions
5. **Image suggestions** for vehicles
6. **Duplicate detection** and marking

### Review & Management
- **Inline editing** of listing details
- **Image replacement** with search suggestions
- **Bulk operations** for efficiency
- **Status tracking** and job management
- **User role management** (admin, moderator, auditor)

## 🔍 Search Features

### Advanced Filtering
- **Text search** across titles and descriptions
- **Type filtering** (vehicle, goods, tools, other)
- **Brand filtering** with autocomplete
- **City filtering** by auction location
- **Price range** filtering
- **Year range** filtering for vehicles
- **Fuel type** filtering

### Search Management
- **Save searches** for quick access
- **Search history** with easy reload
- **Filter chips** showing active filters
- **Clear all filters** functionality
- **URL persistence** for sharing searches

## 🎨 UI/UX Features

### Design System
- **Glassmorphism** effects with backdrop blur
- **Dark theme** optimized for readability
- **Responsive grid** layouts
- **Smooth animations** and transitions
- **Accessible** color contrast and focus states

### Mobile Optimization
- **Touch-friendly** interface
- **Collapsible filters** on mobile
- **Optimized layouts** for small screens
- **Gesture support** for common actions

## 🔧 Configuration

### Environment Variables
```bash
# Frontend
REACT_APP_API_URL=http://localhost:8000/api

# Backend
DATABASE_URL=postgresql://user:pass@localhost/cardouane
REDIS_URL=redis://localhost:6379
TESSERACT_LANG=ara+fra+eng
```

### OCR Settings
- **Language support**: Arabic, French, English
- **Image preprocessing**: Deskew, contrast enhancement, denoising
- **Table detection**: Lattice and stream flavors
- **Confidence thresholds**: Configurable extraction quality

## 📈 Performance

### Optimization Features
- **Debounced search** to reduce API calls
- **Lazy loading** for large datasets
- **Image optimization** and caching
- **Background processing** for heavy tasks
- **Database indexing** for fast queries

### Monitoring
- **Job queue monitoring** with Celery
- **Processing logs** with timestamps
- **Error tracking** and reporting
- **Performance metrics** collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo script for testing

---

**Built with ❤️ for the Tunisian Douane auction system**
