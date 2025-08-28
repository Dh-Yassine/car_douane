# 🚀 FREE Deployment Guide - Car Douane Auction Site

## 🎯 **What We're Deploying**
- **Backend**: Django API on Render (Free PostgreSQL + Web Service)
- **Frontend**: React App on Vercel (Free CDN + Hosting)

---

## 🔧 **STEP 1: Prepare Your Code**

### **1.1 Install Production Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

### **1.2 Test Local Build**
```bash
python manage.py collectstatic --noinput
python manage.py migrate
```

---

## 🌐 **STEP 2: Deploy Backend on Render**

### **2.1 Create Render Account**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (Free tier)

### **2.2 Create PostgreSQL Database**
1. **New → PostgreSQL**
2. **Name**: `car-douane-db`
3. **Database**: `car_douane`
4. **User**: `car_douane_user`
5. **Region**: Choose closest to you
6. **Plan**: Free

### **2.3 Create Web Service**
1. **New → Web Service**
2. **Connect Repository**: Your GitHub repo
3. **Name**: `car-douane-backend`
4. **Environment**: Python 3
5. **Build Command**: `./build.sh`
6. **Start Command**: `gunicorn douane_project.wsgi`

### **2.4 Set Environment Variables**
In your web service settings, add:
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
SECRET_KEY=your-super-secret-key-here
DEBUG=False
CORS_ALLOW_ALL_ORIGINS=False
```

### **2.5 Deploy**
- Click **Create Web Service**
- Wait for build to complete
- Your backend will be live at: `https://car-douane-backend.onrender.com`

---

## ⚡ **STEP 3: Deploy Frontend on Vercel**

### **3.1 Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (Free tier)

### **3.2 Import Repository**
1. **New Project**
2. **Import Git Repository**: Your GitHub repo
3. **Framework Preset**: Create React App
4. **Root Directory**: `frontend`

### **3.3 Set Environment Variables**
In Vercel project settings, add:
```
REACT_APP_API_URL=https://car-douane-backend.onrender.com
```

### **3.4 Deploy**
- Click **Deploy**
- Your frontend will be live at: `https://your-project.vercel.app`

---

## 🔗 **STEP 4: Update API URLs**

### **4.1 Update Frontend API Configuration**
Replace `your-backend-name.onrender.com` in `frontend/src/services/api.js` with your actual Render backend URL.

### **4.2 Test API Connection**
Visit your frontend and check browser console for API calls to ensure they're going to the correct backend URL.

---

## 📋 **STEP 5: Final Configuration**

### **5.1 Update CORS Settings**
In your Django backend, ensure CORS allows your Vercel domain:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-project.vercel.app",
    "https://*.vercel.app",
]
```

### **5.2 Test Everything**
1. ✅ Backend API responds
2. ✅ Frontend loads
3. ✅ API calls work
4. ✅ Database operations work

---

## 🚨 **Important Notes**

### **Free Tier Limitations**
- **Render**: Backend sleeps after 15 min inactivity
- **Vercel**: 100GB bandwidth/month
- **PostgreSQL**: 1GB storage, 90 days retention

### **Costs After Free Tier**
- **Render**: $7/month for always-on backend
- **Vercel**: $20/month for Pro plan
- **PostgreSQL**: $7/month for persistent database

---

## 🆘 **Troubleshooting**

### **Backend Issues**
- Check Render logs for build errors
- Verify environment variables
- Ensure `build.sh` is executable

### **Frontend Issues**
- Check Vercel deployment logs
- Verify API URL environment variable
- Test API endpoints directly

### **Database Issues**
- Check PostgreSQL connection string
- Verify database exists and is accessible
- Check migration status

---

## 🎉 **You're Done!**

Your Car Douane auction site is now live for free on:
- **Backend**: `https://car-douane-backend.onrender.com`
- **Frontend**: `https://your-project.vercel.app`
- **Database**: PostgreSQL on Render

---

## 🔄 **Next Steps (Optional)**

1. **Custom Domain**: Add your own domain name
2. **Monitoring**: Set up uptime monitoring
3. **Backups**: Configure database backups
4. **Scaling**: Upgrade to paid plans when needed

---

## 📞 **Need Help?**

- **Render Docs**: [docs.render.com](https://docs.render.com)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Django Deployment**: [docs.djangoproject.com/en/4.2/howto/deployment](https://docs.djangoproject.com/en/4.2/howto/deployment/)
