# AgriSpark

AgriSpark is a React Native + Expo mobile app that connects farmers and bulk buyers (hotels, companies, wholesalers) for direct produce transactions.

## Objective

- Improve market access for farmers
- Enable direct farmer-to-buyer transactions
- Simplify bulk purchasing and order handling

## Core Features

- Authentication
- Product management for farmers
- Product browsing for buyers
- Order management workflow
- Admin oversight (planned)

## Tech Stack

- Frontend: React Native, Expo, Expo Router
- Language: TypeScript

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the Expo dev server:

```bash
npm run start
```

Useful scripts:

- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`

## Docker (Web Build)

This repository includes a multi-stage Docker build that exports the Expo web app and serves it with Nginx.

Build image:

```bash
docker build -t agrispark-web .
```

Run container:

```bash
docker run --rm -p 8080:80 agrispark-web
```

Then open http://localhost:8080.

## System Design and Flows

### Authentication Flow
![Authentication Flow](images/Authentication%20Flow.png)

### Buyer Browsing and Ordering Flow
![Buyer Browsing and Ordering Flow](images/Buyer%20Browsing%20%26%20Ordering%20Flow.png)

### Farmer Product Management Flow
![Farmer Product Management Flow](images/Farmer%20Product%20Management%20Flow.png)

### Order Management Flow (Farmer Side)
![Order Management Flow (Farmer Side)](images/Order%20Management%20Flow%20(Farmer%20Side).png)

### Full System End-to-End Flow
![Full System End-to-End Flow](images/Full%20System%20End-to-End%20Flow.png)

### Visual Design
![Visual Design](images/Visual-design.png)


![GitHub stars](https://img.shields.io/github/stars/your-username/AgriSpark-App)
![GitHub forks](https://img.shields.io/github/forks/your-username/AgriSpark-App)
![License](https://img.shields.io/github/license/your-username/AgriSpark-App)

# 🌾 AgriSpark

## 📱 Overview

AgriSpark is a mobile application built with **React Native** that connects **farmers** and **bulk buyers** (hotels, companies, wholesalers).
It enables direct product listing, bulk purchasing, and efficient order management without intermediaries.

---

## 🎯 Objective

* Improve market access for farmers
* Enable direct farmer–buyer transactions
* Simplify bulk purchasing

---

## 👥 User Roles

### 🌾 Farmer

* Register & login
* Manage products (add, edit, delete)
* Handle orders (accept/reject)

### 🛍️ Buyer

* Register & login
* Browse products
* Place bulk orders

### 🏛️ Admin 

* Manage users
* Monitor products & orders

---

## ⚙️ Core Features

* 🔐 Authentication (JWT-based)
* 🌾 Product Management (CRUD)
* 🛍️ Product Browsing
* 📦 Order Management
* 💬 Chat System 
* 🏛️ Admin Dashboard 

---

## 🛠️ Tech Stack

* **Frontend:** React Native
* **Backend:** Node.js (Express.js)
* **Database:** MySQL


## 🔄 Workflow

1. User registers (Farmer / Buyer)
2. Farmer lists products
3. Buyer browses and orders
4. Farmer accepts or rejects orders


## 🎨 System Design & Flows

Below are the main design and flow diagrams for AgriSpark:

### Authentication Flow
![Authentication Flow](images/Authentication%20Flow.png)

### Buyer Browsing & Ordering Flow
![Buyer Browsing & Ordering Flow](images/Buyer%20Browsing%20%26%20Ordering%20Flow.png)

### Farmer Product Management Flow
![Farmer Product Management Flow](images/Farmer%20Product%20Management%20Flow.png)

### Order Management Flow (Farmer Side)
![Order Management Flow (Farmer Side)](images/Order%20Management%20Flow%20(Farmer%20Side).png)

### Full System End-to-End Flow
![Full System End-to-End Flow](images/Full%20System%20End-to-End%20Flow.png)

### Visual Design
![Visual Design](images/Visual-design.png)

---


