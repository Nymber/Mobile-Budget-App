import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './static/styles/styles.css';

function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [username, setUsername] = useState('');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${apiUrl}/username`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Unauthorized');
                    }
                    return response.json();
                })
                .then(data => {
                    setUsername(data.username || '');
                })
                .catch(error => {
                    console.error('Error fetching username:', error);
                });
        } else {
            console.error('No token found');
        }
    }, [apiUrl]);

    useEffect(() => {
        if (username) {
            const fetchTasks = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${apiUrl}/tasks`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setTasks(data || []);
                    } else {
                        console.error('Failed to fetch tasks');
                    }
                } catch (error) {
                    console.error('Error fetching tasks:', error);
                }
            };

            fetchTasks();
        }
    }, [username, apiUrl]);

    const handleComplete = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/complete_task/${taskId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                setTasks(prevTasks => 
                    prevTasks.map(task => 
                        task.id === taskId ? { ...task, is_complete: !task.is_complete } : task
                    )
                );
            } else {
                console.error('Failed to complete task');
            }
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    const handleDelete = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/delete_task/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            } else {
                console.error('Failed to delete task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <header className="bg-white shadow p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome, {username}!</h1>
                    <nav>
                        <ul className="flex space-x-4">
                            <li><Link to="/dashboard" className="text-gray-600 hover:text-gray-800">Dashboard</Link></li>
                            <li><Link to="/add-task" className="btn btn-primary mb-4">Add a new task</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>
            <main>
                <h1 className="text-xl font-semibold text-gray-800 mb-4">To-Do List</h1>
                <div className="bg-white shadow-lg rounded-lg p-6 mt-4">
                    <ul className="list-disc list-inside">
                        {tasks.length > 0 ? tasks.map(task => (
                            <li key={task.id} className="mb-2 flex items-center justify-between">
                                <span className={task.is_complete ? 'line-through text-gray-500' : ''}>
                                    {task.title}
                                </span>
                                <div>
                                    <button 
                                        onClick={() => handleComplete(task.id)}
                                        className={`ml-4 ${task.is_complete ? 'text-red-500' : 'text-white-500'} hover:text-green-100`}
                                    >
                                        {task.is_complete ? 'Mark as Incomplete' : 'Mark as Complete'}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(task.id)}
                                        className="ml-4 text-white-500 hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        )) : <li>No tasks available</li>}
                    </ul>
                </div>
            </main>
        </div>
    );
}

export default TaskList;