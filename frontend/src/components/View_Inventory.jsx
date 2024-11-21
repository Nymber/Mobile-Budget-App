import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import $ from 'jquery';
import 'datatables.net';
import Layout from './Layout';

const ViewInventory = () => {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleEdit = useCallback((id) => {
        const itemToEdit = inventoryItems.find(item => item.id === id);
        if (itemToEdit) {
            navigate(`/edit-inventory/${id}`, {
                state: { item: itemToEdit }
            });
        }
    }, [navigate, inventoryItems]);

    const handleDelete = useCallback(async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/inventory/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    setInventoryItems(prev => prev.filter(item => item.id !== id));
                    if ($.fn.DataTable.isDataTable('#inventoryTable')) {
                        $('#inventoryTable').DataTable().row(`[data-id="${id}"]`).remove().draw();
                    }
                }
            } catch (error) {
                console.error('Error deleting item:', error);
            }
        }
    }, []);

    const initializeDataTable = useCallback(() => {
        if ($.fn.DataTable.isDataTable('#inventoryTable')) {
            $('#inventoryTable').DataTable().destroy();
        }

        $('#inventoryTable').DataTable({
            data: inventoryItems,
            columns: [
                { 
                    data: 'name',
                    render: (data, type, row) => `
                        <div class="item-details">
                            <span class="item-name">${data}</span>
                        </div>`
                },
                { 
                    data: 'quantity',
                    render: (data) => `
                        <div class="item-quantity">
                            <span class="item-value">${parseFloat(data).toFixed(0)}</span>
                        </div>`
                },
                { 
                    data: 'price',
                    render: (data) => `
                        <div class="item-price">
                            <span class="item-value">$${parseFloat(data).toFixed(2)}</span>
                        </div>`
                },
                {
                    data: null,
                    orderable: false,
                    className: 'actions-column',
                    render: (data, type, row) => `
                        <div class="action-buttons">
                            <button class="btn btn-primary edit-btn" data-id="${row.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger delete-btn" data-id="${row.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>`
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
                emptyTable: "No inventory items found",
                zeroRecords: "No matching records found"
            },
            dom: '<"top"lf>rt<"bottom"ip><"clear">'
        });
    }, [inventoryItems, handleDelete, handleEdit]);

    useEffect(() => {
        const fetchInventoryItems = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/inventory`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setInventoryItems(data);
                }
            } catch (error) {
                console.error('Error fetching inventory:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInventoryItems();
    }, []);

    useEffect(() => {
        if (inventoryItems.length > 0) {
            initializeDataTable();
        }

        return () => {
            if ($.fn.DataTable.isDataTable('#inventoryTable')) {
                $('#inventoryTable').DataTable().destroy();
            }
        };
    }, [inventoryItems, initializeDataTable]);

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/download-inventory-excel`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'inventory.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error downloading excel:', error);
        }
    };

    const actions = (
        <>
            <li>
                <button onClick={handleDownload} className="btn btn-secondary">
                    <i className="fas fa-download mr-2"></i> Download Excel
                </button>
            </li>
            <li>
                <Link to="/add-inventory" className="btn btn-primary">
                    <i className="fas fa-plus mr-2"></i> Add New Item
                </Link>
            </li>
        </>
    );

    return (
        <Layout title="Inventory Management" actions={actions}>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="table-container">
                    <table id="inventoryTable" className="data-table">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryItems.map(item => (
                                <tr key={item.id} data-id={item.id}>
                                    <td>
                                        <div className="item-details">
                                            <span className="item-name">{item.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="item-quantity">{item.quantity}</div>
                                    </td>
                                    <td>
                                        <div className="item-price">
                                            ${parseFloat(item.price).toFixed(2)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn btn-primary edit-btn" 
                                                onClick={() => handleEdit(item.id)}
                                            >
                                                <i className="fas fa-edit"></i> Edit
                                            </button>
                                            <button 
                                                className="btn btn-danger delete-btn"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <i className="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
};

export default ViewInventory;