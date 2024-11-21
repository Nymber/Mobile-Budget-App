import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import $ from 'jquery';
import 'datatables.net';

//Local Imports
import Layout from './Layout';
import './static/styles/styles.css';

const ViewExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleDelete = useCallback(async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/expenses/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    setExpenses(prev => prev.filter(e => e.id !== id));
                    if ($.fn.DataTable.isDataTable('#expensesTable')) {
                        $('#expensesTable').DataTable().row(`[data-id="${id}"]`).remove().draw();
                    }
                }
            } catch (error) {
                console.error('Error deleting expense:', error);
            }
        }
    }, []);

    const handleEdit = useCallback((id) => {
        navigate(`/edit-expense/${id}`);
    }, [navigate]);

    const initializeDataTable = useCallback(() => {
        if ($.fn.DataTable.isDataTable('#expensesTable')) {
            $('#expensesTable').DataTable().destroy();
        }

        $('#expensesTable').DataTable({
            data: expenses,
            columns: [
                { 
                    data: 'name',
                    render: (data) => `<span class="expense-name">${data}</span>`
                },
                { 
                    data: 'price',
                    render: (data) => `<span class="expense-price">$${parseFloat(data).toFixed(2)}</span>`
                },
                { 
                    data: 'repeating',
                    render: (data) => `<span class="expense-repeating">${data ? 'Yes' : 'No'}</span>`
                },
                { 
                    data: 'timestamp',
                    render: (data) => `<span class="expense-date">${new Date(data).toLocaleString()}</span>`
                },
                {
                    data: null,
                    orderable: false,
                    render: (data, type, row) => `
                        <div class="button-group">
                            <button class="btn btn-primary edit-btn" data-id="${row.id}">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${row.id}">Delete</button>
                        </div>
                    `
                }
            ],
            createdRow: function(row, data) {
                $(row).attr('data-id', data.id);
            },
            drawCallback: function() {
                $('.edit-btn').off('click').on('click', function() {
                    const id = $(this).data('id');
                    handleEdit(id);
                });
                $('.delete-btn').off('click').on('click', function() {
                    const id = $(this).data('id');
                    handleDelete(id);
                });
            },
            responsive: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
            order: [[0, 'asc']],
            language: {
                emptyTable: "No expenses found",
                zeroRecords: "No matching records found"
            }
        });
    }, [expenses, handleDelete, handleEdit]);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/expenses`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setExpenses(data);
                }
            } catch (error) {
                console.error('Error fetching expenses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, []);

    useEffect(() => {
        if (expenses.length > 0) {
            initializeDataTable();
        }

        return () => {
            if ($.fn.DataTable.isDataTable('#expensesTable')) {
                $('#expensesTable').DataTable().destroy();
            }
        };
    }, [expenses, initializeDataTable]);

    const actions = (
        <>
            <li><Link to="/add-expense" className="btn btn-primary">Add New Expense</Link></li>
            <li><Link to="/download-excel" className="nav-link">Download Excel</Link></li>
            <li><Link to="/logout" className="nav-link">Logout</Link></li>
        </>
    );

    return (
        <Layout 
            title="Expenses"
            actions={actions}
        >
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="table-container">
                    <table id="expensesTable" className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Repeating</th>
                                <th>Date</th>
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

export default ViewExpenses;