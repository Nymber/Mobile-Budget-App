import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './static/styles/styles.css';

function AddTask() {
    const [title, setTitle] = useState('');
    const [repeatDaily, setRepeatDaily] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, repeat_daily: repeatDaily }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            navigate('/tasks');
        } catch (error) {
            console.error('Error adding task:', error);
            navigate('/error', { state: { error } });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <header className="bg-white shadow p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Add Task</h1>
                    <nav>
                        <ul className="flex space-x-4">
                            <li><Link to="/dashboard" className="text-gray-600 hover:text-gray-800">Dashboard</Link></li>
                            <li><Link to="/tasks" className="text-gray-600 hover:text-gray-800">Back to Tasks</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>
            
            <main>
                <h1 className="text-xl font-semibold text-gray-800 mb-4">Add a New Task</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-group">
                        <label htmlFor="title" className="block text-gray-700">Task Title:</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title"
                            required
                            className="form-input mt-1 block w-full"
                        />
                    </div>
                    <div className="form-group">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={repeatDaily}
                                onChange={(e) => setRepeatDaily(e.target.checked)}
                                className="form-checkbox"
                            />
                            <span className="ml-2">Repeat Daily</span>
                        </label>
                    </div>
                    <button type="submit" className="btn btn-primary">Add Task</button>
                </form>
                <Link to="/tasks" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">Back to List</Link>
            </main>
        </div>
    );
}

export default AddTask;