# Military-Asset-Management

## Demo:
<img width="1920" height="955" alt="Image" src="https://github.com/user-attachments/assets/cd6f86a2-8d33-4b8a-bd3c-7f33bda61f43" />
<img width="1920" height="955" alt="Image" src="https://github.com/user-attachments/assets/5fe5300f-39a9-4371-b9cd-b969af5ec529" />
<img width="1920" height="955" alt="Image" src="https://github.com/user-attachments/assets/a0089f14-48de-4cb0-aac4-570971917d25" />
<img width="1920" height="955" alt="Image" src="https://github.com/user-attachments/assets/a49d570f-ce72-4415-837e-1bdfe14e8f49" />

## Military Asset Management System (MAMS)

### Project Overview

- The Military Asset Management System (MAMS) is a full-stack web application designed to efficiently track and manage military assets across various bases. It provides functionalities for recording asset purchases, transfers between bases, assignments to personnel, and expenditures. The system features a dashboard for key metrics and a robust Role-Based Access Control (RBAC) system to ensure secure and appropriate access for different user roles (Admin, Base Commander, Logistics Officer).
  Features

      - User Authentication & Authorization: Secure login/logout with JWTs and bcrypt for password hashing. Role-based access control ensures users only access features relevant to their roles.

      - User Management (Admin Only): Administrators can create, view, update, and delete user accounts, assigning roles and bases.

      - Base Management: Create, view, update, and delete military bases.

      - Equipment Type Management: Define and manage different categories of military equipment.

      - Asset Management:

          - Record new assets with details like serial number, equipment type, model, manufacturer, and current base.

          - Track asset status (available, assigned, expended).

          - View comprehensive details and full historical transaction logs for each asset (purchases, transfers, assignments, expenditures).

      - Purchases: Record the acquisition of new assets, updating inventory and balance sheets.

      - Transfers: Facilitate the movement of assets between different military bases, updating their location and balance records.

      - Assignments: Assign assets to specific personnel, tracking who is responsible for which equipment.

      - Expenditures: Mark assets as expended (e.g., used, damaged, lost), removing them from active inventory.

      - Dashboard: Provides an overview of key asset metrics (opening balance, closing balance, net movement, assigned, expended) with filtering capabilities by date, base, and equipment type.

      - Audit Logging: Critical actions are logged for accountability and compliance.

### Technologies Used

#### Backend

```bash
    Node.js: JavaScript runtime environment.

    Express.js: Web application framework for Node.js.

    PostgreSQL: Robust relational database for data storage.

    pg: Node.js client for PostgreSQL.

    bcryptjs: For password hashing.

    jsonwebtoken: For generating and verifying JSON Web Tokens (JWTs) for authentication.

    morgan: HTTP request logger middleware.

    cors: Middleware to enable Cross-Origin Resource Sharing.
```

 

#### Frontend
```bash
    React.js: JavaScript library for building user interfaces.

    Vite: Fast frontend build tool.

    Tailwind CSS: Utility-first CSS framework for rapid UI development and responsive design.

    axios: Promise-based HTTP client for making API requests.

    react-router-dom: For declarative routing in React applications.

    lucide-react: A collection of beautiful and customizable open-source icons.
```
##### Setup Instructions

- Follow these steps to get the project up and running on your local machine.

**1**. Database Setup (PostgreSQL)

```bash
Ensure PostgreSQL is installed and running.

    Create a database:

    CREATE DATABASE asset_management;

    Connect to the database:

    \c asset_management;

    Run the schema creation SQL:
    Execute the SQL statements from your project's schema file (e.g., schema.sql or the initial setup instructions provided during development) to create all necessary tables. This typically includes users, bases, equipment_types, assets, purchases, transfers, assignments, expenditures, asset_balances, and audit_logs.

    Insert Dummy Data (Optional but Recommended for Testing):
    After creating the schema, you can insert dummy data to quickly populate your database for testing.

        First, truncate all tables to ensure a clean slate:

        TRUNCATE TABLE expenditures RESTART IDENTITY CASCADE;
        TRUNCATE TABLE assignments RESTART IDENTITY CASCADE;
        TRUNCATE TABLE transfers RESTART IDENTITY CASCADE;
        TRUNCATE TABLE purchases RESTART IDENTITY CASCADE;
        TRUNCATE TABLE asset_balances RESTART IDENTITY CASCADE;
        TRUNCATE TABLE assets RESTART IDENTITY CASCADE;
        TRUNCATE TABLE users RESTART IDENTITY CASCADE;
        TRUNCATE TABLE equipment_types RESTART IDENTITY CASCADE;
        TRUNCATE TABLE bases RESTART IDENTITY CASCADE;
        TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;

        Then, carefully insert the dummy data. Copy and paste each INSERT block individually into your psql terminal to avoid copy-paste corruption. Refer to the dummy-data-sql-individual-inserts artifact provided previously for the clean SQL statements.
```

**2**. Backend Setup
```bash
   Navigate to the backend directory:

   cd military-asset-management/backend

   Install dependencies:

   npm install

   Create a .env file:
   Create a file named .env in the backend directory and add your database connection string and JWT secret:

   DB_USER=your_postgres_user
   DB_HOST=localhost
   DB_DATABASE=asset_management
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   JWT_SECRET=your_super_secret_jwt_key # Use a strong, random key

   Run the backend server:

   npm run dev

   # Or if you don't have a dev script defined, use:

   # node --watch server.js

   The backend server should start on http://localhost:5000.
```
**3**. Frontend Setup
```bash

   Navigate to the frontend directory:

   cd military-asset-management/frontend

   Install dependencies:

   npm install

   Configure Tailwind CSS:
   Ensure your tailwind.config.js and postcss.config.js are correctly set up to process your React components.

   Run the frontend development server:

   npm run dev

   The frontend application should open in your browser, typically at http://localhost:5173.
```
###### How to Use the Application

    - Login: Access the frontend application (e.g., http://localhost:5173). Use the credentials of a user you've created (e.g., adminuser / password123 if you used the dummy data).

    - Navigation: The sidebar will dynamically display navigation links based on your logged-in user's role.

    - Explore Features:

        Dashboard: View aggregated asset metrics.

        Purchases: Record new asset acquisitions.

        Transfers: Move assets between bases.

        Assignments & Expenditures: Track assigned assets and record expended items.

        All Assets: View a list of all assets and click on individual assets for detailed history.

        User Management (Admin Only): Create and manage user accounts.

###### User Roles and Permissions

    - Admin: Full access to all features, including user management, asset CRUD, and all historical data.

    - Logistics Officer: Can create/view/update assets, record purchases, transfers, assignments, and expenditures. Can view dashboard metrics. Restricted to their assigned base for certain operations.

    - Base Commander: Can view assets at their assigned base, record assignments and expenditures for assets at their base, and view dashboard metrics for their base. Cannot create/update/delete users, bases, or equipment types.

##### API Endpoints
```bash

The backend API is hosted at http://localhost:5000/api.

    POST /api/auth/register - Register a new user (Admin only)

    POST /api/auth/login - Login user

    GET /api/users - Get all users (Admin, BC, LO)

    GET /api/users/:id - Get user by ID (Admin, or self)

    POST /api/users - Create a new user (Admin only)

    PUT /api/users/:id - Update a user (Admin only)

    DELETE /api/users/:id - Delete a user (Admin only)

    GET /api/bases - Get all bases

    POST /api/bases - Create a new base (Admin only)

    PUT /api/bases/:id - Update a base (Admin only)

    DELETE /api/bases/:id - Delete a base (Admin only)

    GET /api/equipment-types - Get all equipment types

    POST /api/equipment-types - Create a new equipment type (Admin only)

    PUT /api/equipment-types/:id - Update an equipment type (Admin only)

    DELETE /api/equipment-types/:id - Delete an equipment type (Admin only)

    GET /api/assets - Get all assets (BC restricted to their base)

    POST /api/assets - Create a new asset (Admin, LO)

    GET /api/assets/:id - Get asset by ID (BC restricted to their base)

    PUT /api/assets/:id - Update an asset (Admin, LO)

    DELETE /api/assets/:id - Delete an asset (Admin only)

    GET /api/assets/:id/details - Get full asset details with history (BC restricted to their base)

    POST /api/purchases - Record a purchase (Admin, LO)

    GET /api/purchases - Get historical purchases (Admin, LO)

    POST /api/transfers - Record a transfer (Admin, LO)

    GET /api/transfers - Get historical transfers (Admin, BC, LO)

    POST /api/assignments - Assign an asset (Admin, BC, LO)

    GET /api/assignments - Get historical assignments (Admin, BC, LO)

    POST /api/expenditures - Record an expenditure (Admin, BC, LO)

    GET /api/expenditures - Get historical expenditures (Admin, BC, LO)

    GET /api/dashboard/metrics - Get dashboard key metrics (Admin, BC, LO)

    GET /api/dashboard/net-movement-details - Get detailed net movement breakdown (Admin, BC, LO)
```
