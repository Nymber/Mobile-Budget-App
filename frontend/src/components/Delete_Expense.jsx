import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './static/styles/styles.css';

function DeleteExpense({ expense }) {
    const navigate = useNavigate();
    const { expenseId } = useParams();

    const handleDelete = async () => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/expenses/${expenseId}`, {
                method: 'DELETE',
            });
            navigate('/expenses');
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    return (
        <div>
            <h1>Delete Expense</h1>
            <div className="container">
                <p>Are you sure you want to delete this expense?</p>
                <p><strong>Expense ID:</strong> {expense.id}</p>
                <p><strong>Name:</strong> {expense.name}</p>
                <p><strong>Price:</strong> {expense.price}</p>
                <p><strong>Repeating:</strong> {expense.repeating ? "Yes" : "No"}</p>
                <p><strong>Timestamp:</strong> {new Date(expense.timestamp).toLocaleString()}</p>
                <div>
                    <button onClick={handleDelete} className="btn btn-danger">
                        Confirm Delete
                    </button>
                    <button onClick={() => navigate('/expenses')} className="btn">
                        Cancel
                    </button>
                </div>
            </div>
            <footer>
                <p>&copy; 2024 YourCompany. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default DeleteExpense;