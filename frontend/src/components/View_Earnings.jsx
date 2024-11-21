import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import $ from 'jquery';
import 'datatables.net';
import Layout from './Layout';

const ViewEarnings = () => {
    const [earnings, setEarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleDelete = useCallback(async (id) => {
        if (window.confirm('Are you sure you want to delete this earning?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/earnings/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    setEarnings(prev => prev.filter(e => e.id !== id));
                    if ($.fn.DataTable.isDataTable('#earningsTable')) {
                        $('#earningsTable').DataTable().row(`[data-id="${id}"]`).remove().draw();
                    }
                }
            } catch (error) {
                console.error('Error deleting earning:', error);
            }
        }
    }, []);

    const handleEdit = useCallback((id) => {
        const earningToEdit = earnings.find(earning => earning.id === id);
        if (earningToEdit) {
            navigate(`/edit-earnings/${id}`, {
                state: { earning: earningToEdit }
            });
        }
    }, [navigate, earnings]);

    const initializeDataTable = useCallback(() => {
        if ($.fn.DataTable.isDataTable('#earningsTable')) {
            $('#earningsTable').DataTable().destroy();
        }

        $('#earningsTable').DataTable({
            data: earnings,
            columns: [
                { 
                    data: 'timestamp',
                    render: data => new Date(data).toLocaleDateString()
                },
                { 
                    data: 'salary',
                    render: data => `$${parseFloat(data).toFixed(2)}`
                },
                { 
                    data: 'hourly_rate',
                    render: data => `$${parseFloat(data).toFixed(2)}`
                },
                { data: 'hours' },
                { 
                    data: 'cash_tips',
                    render: data => `$${parseFloat(data).toFixed(2)}`
                },
                {
                    data: null,
                    orderable: false,
                    render: (data, type, row) => `
                        <div class="action-buttons">
                            <button class="btn btn-primary edit-btn" data-id="${row.id}">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${row.id}">Delete</button>
                        </div>`
                }
            ],
            drawCallback: function() {
                $('.edit-btn').off('click').on('click', function() {
                    handleEdit($(this).data('id'));
                });
                $('.delete-btn').off('click').on('click', function() {
                    handleDelete($(this).data('id'));
                });
            }
        });
    }, [earnings, handleDelete, handleEdit]);

    // Fetch earnings data
    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/earnings`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setEarnings(data);
                }
            } catch (error) {
                console.error('Error fetching earnings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, []); // Empty dependency array means fetch only once

    // Initialize DataTable after data is loaded
    useEffect(() => {
        if (!loading && earnings.length > 0) {
            initializeDataTable();
        }

        return () => {
            if ($.fn.DataTable.isDataTable('#earningsTable')) {
                $('#earningsTable').DataTable().destroy();
            }
        };
    }, [earnings, loading, initializeDataTable]); // Add initializeDataTable to dependencies

    const actions = (
        <>
            <li><Link to="/add-earnings" className="btn btn-primary">Add New Earning</Link></li>
            <li><Link to="/download-excel" className="nav-link">Download Excel</Link></li>
            <li><Link to="/logout" className="nav-link">Logout</Link></li>
        </>
    );

    return (
        <Layout title="Earnings History" actions={actions}>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="table-container">
                    <table id="earningsTable" className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Salary</th>
                                <th>Hourly Rate</th>
                                <th>Hours Worked</th>
                                <th>Cash Tips</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
};

export default ViewEarnings;
