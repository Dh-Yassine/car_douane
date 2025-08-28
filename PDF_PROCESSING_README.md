# Car Douane PDF Processing System

This system provides a complete workflow for processing Tunisian customs auction PDFs:

1. **Django Admin Interface** - Upload PDFs and extract text via OCR
2. **TXT File Generation** - Save extracted text as `.txt` files in the root folder
3. **n8n Workflow** - Process TXT files with AI to generate structured JSON
4. **Django API Integration** - Import processed listings into the database

## 🚀 Quick Start

### 1. Extract Text from PDFs

#### Option A: Using Django Admin (Recommended)
1. Start Django server: `cd backend && python manage.py runserver`
2. Go to `http://localhost:8000/admin/`
3. Navigate to "PDF uploads" section
4. Upload a PDF file
5. Click "Extract Text to TXT" action
6. TXT file will be saved in the root `CAR_DOUANE` folder

#### Option B: Using Command Line
```bash
# Extract from specific PDF
python extract_pdf_text.py "2025-08-07_AV_OP_Kef_N°03-2025.pdf"

# Extract from all PDFs in current directory
python extract_pdf_text.py --all-pdfs

# Extract from specific folder
python extract_pdf_text.py --folder ./pdfs
```

#### Option C: Using Django Management Command
```bash
cd backend

# Extract from specific PDF upload by ID
python manage.py extract_pdf_text --pdf-id 1

# Extract from all unprocessed PDFs
python manage.py extract_pdf_text --all

# Force re-extraction
python manage.py extract_pdf_text --pdf-id 1 --force
```

### 2. Test the Extraction
```bash
python test_pdf_extraction.py
```

### 3. Process with n8n
1. Import the updated `n8n.json` workflow
2. Set up Google Gemini API credentials
3. Run the workflow to process TXT files

## 📁 File Structure

```
CAR_DOUANE/
├── backend/                    # Django backend
│   ├── listings/admin.py      # Enhanced admin interface
│   ├── listings/management/   # Management commands
│   └── ocr_parser/           # OCR processing
├── frontend/                  # React frontend
├── *.pdf                      # Original PDF files
├── *.txt                      # Generated text files (for n8n)
├── extract_pdf_text.py        # Standalone extraction script
├── test_pdf_extraction.py     # Test script
└── n8n.json                   # Updated n8n workflow
```

## 🔧 Django Admin Features

### Enhanced PDF Upload Admin
- **TXT File Status**: Shows whether text has been extracted
- **TXT File Path**: Displays where the TXT file is saved
- **Action Buttons**: 
  - Extract Text to TXT
  - View TXT content
  - Download TXT file
  - Process PDF for listings

### Admin Actions
- **Extract Text to TXT**: Bulk extract text from multiple PDFs
- **Mark as Processed**: Track processing status
- **Filter by Status**: Find unprocessed PDFs

## 📝 TXT File Generation

### File Location
TXT files are saved in the root `CAR_DOUANE` folder with the same name as the PDF:
- `2025-08-07_AV_OP_Kef_N°03-2025.pdf` → `2025-08-07_AV_OP_Kef_N°03-2025.txt`

### File Content
The TXT files contain the raw extracted text from the PDFs, ready for AI processing by n8n.

## 🤖 n8n Workflow

### Updated Workflow Features
- **Dynamic TXT Scanning**: Automatically finds new TXT files
- **Duplicate Prevention**: Tracks processed files to avoid reprocessing
- **Gemini API Integration**: Uses standard HTTP Request nodes
- **Error Handling**: Better logging and error recovery
- **File Management**: Organizes output files with timestamps

### Workflow Steps
1. **Scan for TXT Files**: Looks for new TXT files in root folder
2. **Filter New Files**: Avoids duplicates and old files
3. **Read Text Content**: Loads TXT file content
4. **Build AI Prompt**: Creates structured prompt for Gemini
5. **Call Gemini API**: Processes text with AI
6. **Parse Response**: Extracts structured JSON
7. **Validate Data**: Ensures data quality
8. **Write JSON File**: Saves processed listings
9. **Create Auction Data**: Formats data for Django API
10. **Search Images**: Finds relevant images for listings
11. **Send to Django**: Imports listings into database
12. **Mark as Processed**: Tracks completion

## 🔑 API Configuration

### Google Gemini API
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create credentials in n8n with name `googleGeminiApi`
3. Use the API key: `AIzaSyAXGVOXdE0hLQpEPMvdeXdPV2JEWwRHhA4`

### Django API
- **URL**: `http://127.0.0.1:8000/api/listings/`
- **Authentication**: Configure as needed
- **Endpoints**: Uses the existing Django REST API

## 📊 Monitoring & Logging

### Django Admin
- View processing status in admin interface
- Check TXT file generation status
- Monitor PDF upload progress

### n8n Workflow
- Console logging for each step
- File processing statistics
- Error reporting and recovery

### Generated Files
- TXT files: Raw extracted text
- JSON files: Structured listing data
- Log files: Processing history

## 🧪 Testing

### Test PDF Extraction
```bash
python test_pdf_extraction.py
```

### Test Django Admin
1. Upload a test PDF
2. Extract text to TXT
3. Verify TXT file creation
4. Check file content

### Test n8n Workflow
1. Ensure TXT files exist
2. Run workflow manually
3. Check JSON output
4. Verify Django API integration

## 🔄 Workflow

```
PDF Upload → OCR Processing → TXT Generation → n8n Processing → JSON Output → Django Import
     ↓              ↓              ↓              ↓              ↓            ↓
  Django Admin   OCR Parser   Root Folder    Gemini AI    Structured    Database
```

## 🚨 Troubleshooting

### Common Issues

#### TXT File Not Generated
- Check PDF file format and readability
- Verify OCR parser is working
- Check file permissions

#### n8n Workflow Fails
- Verify Gemini API key is correct
- Check TXT file exists and is readable
- Review workflow logs for errors

#### Django API Errors
- Ensure Django server is running
- Check API endpoint configuration
- Verify data format compatibility

### Debug Commands
```bash
# Check Django admin
cd backend && python manage.py runserver

# Test OCR extraction
python test_pdf_extraction.py

# View generated files
ls -la *.txt *.json
```

## 📈 Next Steps

### Phase 1: Basic OCR & Processing ✅
- [x] PDF upload via Django admin
- [x] OCR text extraction
- [x] TXT file generation
- [x] n8n workflow integration

### Phase 2: Enhanced Processing
- [ ] Image suggestion integration
- [ ] Duplicate detection
- [ ] Data validation improvements
- [ ] Batch processing optimization

### Phase 3: Automation
- [ ] Scheduled PDF processing
- [ ] Email notifications
- [ ] Processing queue management
- [ ] Performance monitoring

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review workflow logs
3. Test with sample PDFs
4. Verify configuration settings

---

**🎯 Goal**: Create a seamless workflow from PDF upload to structured listing data, enabling efficient processing of Tunisian customs auction documents.
