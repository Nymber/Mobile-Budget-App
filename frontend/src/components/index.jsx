import React from 'react';
import { Link } from 'react-router-dom';
import './static/styles/styles.css';

function HomePage() {
    return (
        <div className="home-page">
            <div className="container">
                <h1 className="title">
                    Shimi
                </h1>

                <div className="cta-section">
                    <div className="button-group">
                        <Link to="/Login" className="btn btn-primary">
                            Sign In
                        </Link>
                        
                        <Link to="/Register" className="btn btn-secondary">
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>

            <footer className="footer">
                <p>
                    © Shimi
                </p>
            </footer>
        </div>
    );
}

export default HomePage;