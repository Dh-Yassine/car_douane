# Douane Auction Viewer - Project Structure

```
Car_Douane/
├── backend/                    # Django Backend
│   ├── douane_project/        # Django project settings
│   ├── listings/              # Django app for auction listings
│   ├── ocr_parser/            # OCR and PDF parsing utilities
│   ├── media/                 # Uploaded PDFs and images
│   ├── static/                # Static files
│   ├── manage.py
│   └── requirements.txt
├── frontend/                  # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── README.md
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
├── venv/                      # Virtual environment
├── .env                       # Environment variables
├── .gitignore
└── README.md
```

## Key Components:

### Backend (Django)
- **douane_project/**: Main Django project with settings
- **listings/**: Django app for auction listings models and API
- **ocr_parser/**: OCR utilities and PDF parsing logic
- **media/**: Storage for uploaded PDFs and generated images

### Frontend (React)
- **components/**: Reusable UI components (Card, Search, Filter)
- **pages/**: Main pages (Home, ListingDetail, Admin)
- **services/**: API calls and external services
- **utils/**: Helper functions

### Shared
- **scripts/**: Utility scripts for PDF processing, data migration
- **docs/**: Project documentation and API specs
