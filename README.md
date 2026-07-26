# Swadeshi Kitchen Backend API

Production-ready REST API backend for **Swadeshi Kitchen**, built with Node.js, Express, MySQL, and Amazon S3 image hosting.

---

## 🛠️ Tech Stack
* **Runtime**: Node.js (v18+ LTS)
* **Framework**: Express.js
* **Database**: MySQL (mysql2 with connection pool)
* **Authentication**: JWT & bcrypt password hashing
* **File Storage**: AWS SDK v3 + Multer S3 (Amazon S3)
* **Security**: Helmet, CORS, Rate Limiting, express-validator
* **Process Manager**: PM2 (Cluster Mode)
* **Web Server**: Nginx (Reverse Proxy)

---

## 🚀 AWS EC2 Deployment Guide (Step-by-Step)

### Step 1: Connect to your Ubuntu EC2 Instance
```bash
ssh -i "your-key.pem" ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com
```

### Step 2: Update System & Install Required Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### Step 3: Setup MySQL Database
```bash
sudo mysql
```
Inside MySQL shell:
```sql
CREATE DATABASE swadeshi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'swadeshi_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON swadeshi_db.* TO 'swadeshi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Run schema and seed files:
```bash
mysql -u swadeshi_user -p swadeshi_db < backend/sql/schema.sql
mysql -u swadeshi_user -p swadeshi_db < backend/sql/seed.sql
```

### Step 4: Clone & Configure Project
```bash
git clone https://github.com/YourUsername/swadeshi-kitchen-backend.git
cd backend
npm install --production

# Create .env file
cp .env.example .env
nano .env
```
Fill in your database credentials, JWT secret, AWS S3 keys, and `FRONTEND_URL`.

### Step 5: Start Server with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 6: Configure Nginx Reverse Proxy
```bash
sudo cp nginx.conf /etc/nginx/sites-available/swadeshi
sudo ln -s /etc/nginx/sites-available/swadeshi /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📡 API Endpoints Overview

### Authentication
* `POST /api/auth/login` - Admin login (returns JWT token)
* `POST /api/auth/logout` - Admin logout
* `GET /api/auth/profile` - Fetch logged-in admin details
* `PUT /api/auth/change-password` - Update password

### Menu Management
* `GET /api/menu` - Fetch all menu items
* `GET /api/menu/:id` - Fetch single menu item details
* `POST /api/menu` - Add menu item (supports image upload to Amazon S3)
* `PUT /api/menu/:id` - Edit menu item
* `DELETE /api/menu/:id` - Delete menu item (removes image from S3)

### Categories
* `GET /api/categories` - Fetch all categories
* `POST /api/categories` - Create new category
* `PUT /api/categories/:id` - Update category
* `DELETE /api/categories/:id` - Delete category

### Orders
* `POST /api/orders` - Customer checkout / order creation
* `GET /api/orders` - Admin order list (with status & search filters)
* `GET /api/orders/:id` - Order details with items
* `PUT /api/orders/:id/status` - Update status (Pending, Preparing, Out for Delivery, etc.)
* `DELETE /api/orders/:id` - Delete order

### Analytics & Dashboard
* `GET /api/dashboard` - Get total revenue, order metrics, and category counts
