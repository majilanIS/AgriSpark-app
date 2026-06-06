# AgriSpark 🌾

AgriSpark is a mobile agricultural marketplace built with Expo and React Native that connects farmers, buyers, and administrators on a single platform. The system enables farmers to directly sell agricultural products, buyers to discover and purchase products, and administrators to monitor platform activities.

The platform aims to reduce agricultural product waste, improve market access for farmers, and create a more efficient agricultural supply chain through digital technology.

---

## Key Features

### 👨‍🌾 Farmer Features

* Secure registration and authentication
* Product creation, editing, and deletion
* Product inventory management
* Order management (Accept / Reject orders)
* Real-time chat with buyers
* Profile management
* Dashboard with farm activity overview

### 🛒 Buyer Features

* Secure registration and authentication
* Browse available agricultural products
* Search and filter products
* View product details
* Add products to cart
* Place orders
* Track order status
* Real-time chat with farmers
* Profile management

### 🧑‍💼 Admin Features

* Manage farmers and buyers
* Monitor products
* Monitor orders
* View platform analytics
* Manage reports and issues
* System administration dashboard

### 🤖 AgriSpark AI Assistant

AgriSpark AI is an integrated chatbot that assists users with:

* Application guidance and support
* Product and order assistance
* Frequently asked questions
* Agricultural market information
* Standard product price lookup

Supported Languages:

* English
* Amharic (አማርኛ)
* Afaan Oromo (Oromiffa)
* Tigrinya (ትግርኛ)

---

## Tech Stack

### Frontend

* React Native
* Expo
* Expo Router
* TypeScript

### Backend

* Supabase
* Supabase Authentication
* PostgreSQL Database
* Express.js API

### Development Tools

* Git & GitHub
* EAS Build
* ESLint

---

## Core Modules

### Authentication System

* Role-based access control
* Farmer accounts
* Buyer accounts
* Admin accounts
* Secure authentication using Supabase

### Product Management

Farmers can:

* Add products
* Edit products
* Delete products
* Manage inventory

### Product Browsing

Buyers can:

* Browse products
* Search products
* Filter products
* View detailed product information

### Cart Management

Buyers can:

* Add products to cart
* Update quantities
* Remove items
* Checkout products

### Order Management

Order statuses include:

* Pending
* Accepted
* Rejected

### Payment Management

* Payment processing
* Payment status tracking
* Payment records and history

### Real-Time Chat

* Buyer ↔ Farmer communication
* Order-related discussions
* Message history tracking

### AI Assistant

* User guidance
* Product assistance
* Market price information
* Multilingual support

---

## Farmer Dashboard

The farmer dashboard serves as the central workspace for managing products and orders.

Features include:

* Welcome banner
* Farm activity overview
* Product inventory summary
* Recent products
* Order notifications
* Quick actions
* Profile management

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
EXPO_PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_CHATBOT_BASE_URL=http://127.0.0.1:8000
```

### 3. Start Development Server

```bash
npm run start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

---

## Build APK

Generate an Android APK using Expo EAS:

```bash
eas build -p android --profile preview
```

Generate a production build:

```bash
eas build -p android --profile production
```

---

## Docker Deployment

Build and run using Docker Compose:

```bash
docker compose up --build
```

Open:

```text
http://localhost:8080
```

Build manually:

```bash
docker build \
  --build-arg EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL \
  --build-arg EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
  -t agrispark-web .
```

---

## Future Enhancements

* Push Notifications
* Advanced Analytics Dashboard
* Delivery Tracking
* Voice-Based AI Assistant
* Weather Information Integration
* Agricultural Advisory Services
* Price Trend Analysis
* Google Play Store Deployment

---

## Project Goal

AgriSpark aims to empower Ethiopian farmers through digital access to markets while helping buyers efficiently source agricultural products. The platform creates a transparent, scalable, and user-friendly ecosystem for agricultural commerce.
