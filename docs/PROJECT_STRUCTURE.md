# Campus Resource Management System - Frontend Structure

## Final Project Structure

```text
campus-resource-management-system/
│
├── frontend/
│
│   ├── index.html                 # Login Page
│
│   ├── pages/
│   │   ├── dashboard.html
│   │   ├── resources.html
│   │   ├── bookings.html
│   │   ├── complaints.html
│   │   ├── profile.html
│   │   └── admin.html
│   │
│   ├── css/
│   │   ├── global.css
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   ├── resources.css
│   │   ├── bookings.css
│   │   ├── complaints.css
│   │   ├── profile.css
│   │   └── admin.css
│   │
│   ├── js/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── resources.js
│   │   ├── bookings.js
│   │   ├── complaints.js
│   │   ├── profile.js
│   │   ├── admin.js
│   │   └── common.js
│   │
│   ├── components/
│   │   ├── navbar.html
│   │   ├── sidebar.html
│   │   └── footer.html
│   │
│   └── assets/
│       ├── images/
│       └── icons/
│
├── README.md
└── .gitignore
```

---

# Page Overview

## 1. Login (`index.html`)

### Purpose
Authentication.

### Features

- Login
- Role detection (backend later)
- Redirect to Dashboard

### Flow

```text
Student → Dashboard
Faculty → Dashboard
Admin → Dashboard
```

---

## 2. Dashboard (`dashboard.html`)

### Purpose

Acts as the application's **Home Page**.

It summarizes the current status instead of performing actions.

### Sections

- Welcome message
- Resources Available
- My Active Bookings
- Pending Complaints
- Latest Announcements
- Upcoming Booking
- Recent Notifications

**Question answered:** *"What's happening right now?"*

---

## 3. Resources (`resources.html`)

### Purpose

Core module for managing campus resources.

### Example Resources

- Meeting Room
- Computer Lab
- Projector
- Seminar Hall
- Auditorium

### Features

- Search
- Filter
- Book Resource

### Admin Features

- Add Resource
- Edit Resource
- Delete Resource

### Related Database Tables

- Resources
- Departments

---

## 4. Bookings (`bookings.html`)

### Purpose

Everything related to reservations.

### Features

- Current Bookings
- Booking History
- Booking Status
- Cancel Booking
- View Booking Details

Booking requests made from the **Resources** page will appear here.

---

## 5. Complaints (`complaints.html`)

### Purpose

Report maintenance or resource issues.

### Example Complaints

- Projector not working
- WiFi down
- Broken Chair
- AC not working

### Features

- Complaint Form
- Complaint List
- Complaint Status
- Pending / Resolved

Students submit complaints.

Admins resolve them.

---

## 6. Profile (`profile.html`)

### Purpose

Manage user information.

### Features

- Name
- Department
- Email
- Role
- Phone Number
- Edit Profile
- Change Password

---

## 7. Admin (`admin.html`)

> Only visible to administrators.

### Purpose

System management.

### Sections

- Users
- Resources
- Bookings
- Complaints
- Announcements
- Maintenance

Think of it as the **Control Room** of the application.

---

# Components

Reusable UI elements shared across pages.

```text
Navbar
Sidebar
Footer
```

This keeps every page visually consistent.

---

# Assets

```
assets/
├── images/
└── icons/
```

Examples:

- College Logo
- Background Images
- Icons
- Illustrations

---

# CSS Structure

One stylesheet per page.

Example:

```text
dashboard.css
```

Contains **only** dashboard-specific styles.

Avoid mixing styles between pages.

---

# JavaScript Structure

One JavaScript file per page.

Example:

```text
dashboard.js
```

Possible responsibilities:

- Load dashboard data
- Update dashboard cards
- Load announcements
- Load notifications
- Sidebar toggle

No booking-related code should be placed here.

---

# `common.js`

Contains reusable utility functions used across the project.

Examples:

```javascript
showToast()

toggleSidebar()

logout()

showLoader()

formatDate()
```

Keep this file limited to shared utilities.

---

# Navigation Flow

```text
Login
   │
   ▼
Dashboard
   │
   ├──────────────┐
   ▼              ▼
Resources     Bookings
   │              │
   └──────┐   ┌───┘
          ▼   ▼
      Complaints
           │
           ▼
        Profile

(Admin)
     │
     ▼
   Admin Panel
```

The project contains **only seven pages**, with each page representing one major module.

---

# Pages to Avoid Creating

Avoid creating separate pages like:

```text
edit-resource.html
book-resource.html
booking-details.html
complaint-details.html
change-password.html
add-resource.html
announcement.html
```

Instead, use UI components such as:

- Modal
- Popup
- Hidden Form
- Accordion

### Example

```text
Resources

↓

Click "Add Resource"

↓

Modal Opens

↓

Submit

↓

Modal Closes
```

This approach is closer to how modern web applications are designed.

---

# Skills You'll Gain

By completing this frontend, you'll gain experience with:

- Multi-page website development
- Responsive layouts
- JavaScript DOM manipulation
- Clean project organization
- Git & GitHub collaboration
- Frontend design around a relational database
- Preparing a frontend for Spring Boot integration

---

# Future Repository Structure

Once the backend is developed, the project can naturally evolve into:

```text
campus-resource-management-system/
│
├── frontend/
└── backend/
```

The frontend structure will not require any major changes, making it a solid foundation for backend integration.