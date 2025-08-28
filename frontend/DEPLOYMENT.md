# Deployment Guide

## API Configuration

The frontend automatically detects the current hostname and configures the API URL accordingly:

- **Localhost**: `http://localhost:8000`
- **Local Network**: `http://192.168.1.1:8000` (or whatever IP you're using)
- **Production**: Uses the same domain as the frontend with port 8000

## Environment Variables

To override the automatic detection, create a `.env` file in the frontend directory:

```bash
# For production deployment
REACT_APP_API_URL=https://your-backend-domain.com

# For custom local setup
REACT_APP_API_URL=http://192.168.1.100:8000
```

## Deployment Scenarios

### 1. Local Development
```bash
# Frontend on localhost:3000, Backend on localhost:8000
npm start
```

### 2. Local Network Access
```bash
# Frontend accessible from 192.168.1.1:3000
# Backend must be accessible from 192.168.1.1:8000
npm start
```

### 3. Production Deployment
```bash
# Build the app
npm run build

# Deploy the build folder to your hosting service
# The app will automatically use the same domain for the API
```

## Backend Configuration

Make sure your Django backend is configured to accept requests from all necessary origins:

```python
# settings.py
ALLOWED_HOSTS = ['*']  # For development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://192.168.1.1:3000",
    "https://yourdomain.com"
]
```

## Troubleshooting

### Can't see listings from network IP
1. Check if backend is running on the correct IP/port
2. Verify CORS settings in Django
3. Check browser console for API errors
4. Ensure firewall allows connections to port 8000

### API calls failing
1. Check browser console for the detected API URL
2. Verify the backend is accessible from the frontend's location
3. Check network connectivity between frontend and backend hosts
