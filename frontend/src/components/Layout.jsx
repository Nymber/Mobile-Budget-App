import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ title, children, actions }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                        <nav>
                            <ul className="flex space-x-4 items-center">
                                <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
                                {actions}
                            </ul>
                        </nav>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;