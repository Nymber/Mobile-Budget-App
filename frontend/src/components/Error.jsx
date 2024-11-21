import React from 'react';
import './static/styles/styles.css';

const ErrorPage = ({ error }) => {
    const errorMessage = error?.message || 'An unexpected error occurred';
    const errorStack = error?.stack || 'No stack trace available';

    return (
        <div className="container">
            <h2>Error</h2>
            <p>An error occurred:</p>
            <p>{errorMessage}</p>
            {errorStack && (
                <>
                    <h3>Stack Trace:</h3>
                    <pre>{errorStack}</pre>
                </>
            )}
            <p>Please try again later or contact support if the problem persists.</p>
        </div>
    );
};

export default ErrorPage;