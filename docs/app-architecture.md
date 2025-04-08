# Mobile Budget App Architecture

This document provides an overview of the Mobile Budget App's architecture, outlining the main components, data flow, and system design.

## System Overview

The Mobile Budget App follows a client-server architecture with:

- **Frontend**: Next.js-based responsive web application optimized for mobile devices
- **Backend**: Python FastAPI server providing RESTful endpoints
- **Database**: SQLite database for data persistence

## Component Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│    Frontend     │◄────►│    Backend      │◄────►│    Database     │
│    (Next.js)    │      │    (FastAPI)    │      │    (SQLite)     │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Frontend Architecture

The frontend is organized using Next.js framework with the following structure:

- **app**: Contains Next.js app router pages and layouts
- **components**: Reusable UI components categorized by functionality
  - **auth**: Authentication-related components
  - **dashboard**: Dashboard and financial visualization components
  - **ui**: Shared UI components (buttons, cards, inputs)
- **services**: API and authentication services
- **hooks**: Custom React hooks
- **lib**: Utility functions

### Backend Architecture

The backend follows a modular structure with:

- **routes**: API endpoints organized by feature
- **auth.py**: Authentication and authorization logic
- **calculations.py**: Financial calculations
- **db_env.py**: Database configuration
- **scheduler_tasks.py**: Background tasks for recurring operations

## Data Flow

1. User requests are sent from the frontend to the backend API
2. Backend validates requests and performs business logic
3. Data is retrieved from or written to the database
4. Backend returns responses to the frontend
5. Frontend updates UI based on responses

## Authentication Flow

The app uses JWT (JSON Web Tokens) for authentication. See [auth-flow.md](auth-flow.md) for detailed information.

## Key Technologies

- **Frontend**:
  - Next.js (React framework)
  - Tailwind CSS for styling
  - shadcn/ui component library
  - Recharts for data visualization

- **Backend**:
  - Python FastAPI
  - SQLite database
  - JWT for authentication
  - OCR capabilities for receipt scanning

## Deployment Architecture

The application can be deployed in the following configuration:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│   Web Browser   │◄────►│   Web Server    │◄────►│  API Server     │
│   Mobile Device │      │   (Next.js)     │      │  (FastAPI)      │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │                 │
                                                  │    Database     │
                                                  │    (SQLite)     │
                                                  │                 │
                                                  └─────────────────┘
```