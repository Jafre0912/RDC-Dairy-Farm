# Dairy Management System

## Overview

A comprehensive system designed to manage dairy operations efficiently and effectively.

## Features

- Livestock Management
- Milk Production Tracking
- Feed Inventory
- Health Records
- Financial Reports
- Employee Management

## Installation and usage

1. Open Dairy Management Folder

```bash
cd DairyManagement
```

### Open two terminal windows:

1. Install dependencies and Start the client:

```bash
cd client
npm install
npm run dev
```

2. Install dependencies and Start the server:

```bash
cd server
npm install
npm run dev
```

## Admin Setup

To create an administrator account, run the following commands:

```bash
cd server
node src/scripts/createAdminUser.js
```

This script will:
- Check if an admin user already exists
- Create a new admin user if one doesn't exist
- Output the admin credentials (email and password)

Default admin credentials:
- Email: admin@farmflow.com
- Password: admin123

**Note:** It's recommended to change the default password after first login for security reasons.
