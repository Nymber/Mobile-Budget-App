# Authentication Flow

This document outlines the authentication flow for the Mobile Budget App, including login, protected route access, logout, and error handling.

## Overview

The app uses JWT (JSON Web Tokens) for authentication. Tokens are stored in the frontend's `localStorage` and are validated for accessing protected routes.

## Authentication Flow Diagram

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│               │      │               │      │               │      │               │
│     User      │◄────►│   Frontend    │◄────►│   Backend     │◄────►│   Database    │
│               │      │               │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘      └───────────────┘
```

## Login Flow

1. User enters credentials in the frontend.
2. Frontend sends a `POST /login` request to the backend with the username and password.
3. Backend verifies the credentials with the database.
4. If valid, the backend responds with a token and user data.
5. Frontend stores the token in `localStorage` and sets the authentication state.

## Protected Route Access

1. User attempts to access a protected route.
2. Frontend checks the authentication state and validates the token.
3. If the token is expired:
    - Frontend sends a `POST /refresh-token` request to the backend.
    - Backend verifies the token with the database and responds with a new token.
    - Frontend updates the token.
4. If the token is valid:
    - Frontend sends a `GET /protected` request to the backend.
    - Backend verifies the token with the database and responds with the requested data.

## Logout Flow

1. User clicks the logout button.
2. Frontend clears the token from `localStorage` and resets the authentication state.
3. User is redirected to the login page.

## Error Handling

- **Invalid Credentials**: Backend responds with `401 Unauthorized`, and the frontend displays an error message.
- **Network Errors**: Frontend displays an error message to the user.

## Key Technologies

- **Frontend**:
  - JWT stored in `localStorage`
  - React state management for authentication state

- **Backend**:
  - JWT generation and validation
  - Token refresh endpoint
  - Database for user credential verification
