# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Add Required Audio File
Place a file named `Q1.mp3` in the `public/` directory. This audio will play when showing image-to-word questions.

### Step 2: Access the Application
The development server is already running at:
- **Main Page**: http://localhost:3000
- **Admin Portal**: http://localhost:3000/admin/login
- **Student Portal**: http://localhost:3000/app/login

### Step 3: Login and Setup

#### Admin Login
- URL: http://localhost:3000/admin/login
- Username: `admin`
- Password: `admin123`

**First time setup:**
1. Add vocabularies (with images and audio)
2. Select target vocabularies for students
3. Configure points and rewards settings
4. Initialize settlement cycle (optional)

#### Student Login
- URL: http://localhost:3000/app/login
- Username: `user`
- Password: `user123`

**Start learning:**
1. Click "Start Earning" button
2. Answer questions (image-to-word or word-to-image)
3. Earn points and rewards!

## 📝 Important Notes

- **Database**: SQLite database will be created automatically in `prisma/db.sqlite`
- **File Uploads**: Images and audio are stored in `public/uploads/`
- **Session**: Login sessions are stored in cookies and last 7 days
- **Settlement**: Automatic reset happens on the configured day each month

## 🔧 Useful Commands

```bash
# View database in browser
npm run db:studio

# Stop development server
# Press Ctrl+C in the terminal

# Restart development server
npm run dev
```

## 💡 Tips

1. **Add vocabularies first** before students can start learning
2. **Upload both image and audio** for the best learning experience
3. **Set target vocabularies** to control which words students see
4. **Configure settlement cycle once** - it cannot be changed later
5. **Check point history** to see detailed learning progress

## 🎯 Example Workflow

1. **Admin**: Add 10 vocabulary words with images and audio
2. **Admin**: Select 5 words as "target vocabularies"
3. **Admin**: Set points per question to 10
4. **Admin**: Set max reward per cycle to 500
5. **Student**: Login and start learning
6. **Student**: Answer questions and see points/rewards grow
7. **Student**: Check history to see all point changes

Enjoy learning! 🎓
