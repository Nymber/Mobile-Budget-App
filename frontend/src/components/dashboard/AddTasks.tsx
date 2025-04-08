import React, { useState } from 'react';
import { createTask } from '@/services/api';
import styles from './styles/AddTasks.module.css';

const AddTasks: React.FC = () => {
  const [task, setTask] = useState({
    title: '',
    repeatDaily: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await createTask({
        title: task.title,
        repeat_daily: task.repeatDaily,
        is_complete: false,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setTask({ title: '', repeatDaily: false });
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add New Task</h1>
      <div className={styles.formContainer}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>Task added successfully!</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="title" className={styles.label}>Title</label>
            <input
              type="text"
              id="title"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="repeatDaily"
              checked={task.repeatDaily}
              onChange={(e) => setTask({ ...task, repeatDaily: e.target.checked })}
              className={styles.checkbox}
            />
            <label htmlFor="repeatDaily" className={styles.checkboxLabel}>Repeat daily</label>
          </div>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTasks;
