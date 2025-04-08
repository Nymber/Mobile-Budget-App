# Login and Registration Flow

This document outlines the login and registration flow for the Mobile Budget App.

## Login Flow

1. **User Input**: The user enters their username and password.
2. **API Request**: A POST request is sent to the `/login` endpoint with the following payload:
   ```json
   {
     "username": "<username>",
     "password": "<password>"
   }
   ```
3. **Response Handling**:
   - On success, the server responds with an access token:
     ```json
     {
       "access_token": "<token>",
       "token_type": "bearer"
     }
     ```
   - The token is stored in `localStorage` and the user is redirected to the dashboard.
   - On failure, an error message is displayed.

## Registration Flow

1. **User Input**: The user enters their username, email, and password.
2. **API Request**: A POST request is sent to the `/register` endpoint with the following payload:
   ```json
   {
     "username": "<username>",
     "email": "<email>",
     "password": "<password>"
   }
   ```
3. **Response Handling**:
   - On success, the user is prompted to log in.
   - On failure, an error message is displayed.

## Error Handling

- If the server returns an error (e.g., invalid credentials or username already exists), the error message is displayed to the user.
- Network errors are also caught and displayed.

## Code Reference

The login and registration logic is implemented in the `frontend/app/page.tsx` file. Key functions include:

- `handleSubmit`: Handles form submission for both login and registration.
- `apiPost`: Sends API requests to the backend.
- `useAuth`: Manages authentication state.

## Backend Endpoints

- **Login**: `POST /login`
- **Register**: `POST /register`

Refer to the backend `routes/auth_routes.py` file for detailed implementation of these endpoints.