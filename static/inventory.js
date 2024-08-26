$(document).ready(function () {
    $('#inventoryTable').DataTable({
        "paging": true, // Enable pagination
        "searching": true, // Enable search functionality
        "order": [[0, 'desc']], // Order by Item ID (descending) by default
        "columnDefs": [{ "orderable": false, "targets": -1 }] // Disable sorting for last column (Actions)
    });
});

// Function to confirm delete action
function confirmDelete(itemId) {
    if (confirm('Are you sure you want to delete this inventory item?')) {
        document.getElementById('deleteForm-' + itemId).submit();
    }
}
// Function to handle update item action
function updateItem(itemId) {
    // Remove 'selected' class from all update buttons
    $('.update-btn').removeClass('selected');
    // Add 'selected' class to the clicked update button
    $('#updateForm-' + itemId + ' .update-btn').addClass('selected');

    // Retrieve values from the selected item and populate the modal fields
    var itemName = $('#updateForm-' + itemId).closest('tr').find('td:nth-child(2)').text();
    var quantity = $('#updateForm-' + itemId).closest('tr').find('td:nth-child(3)').text();
    var unitOfMeasurement = $('#updateForm-' + itemId).closest('tr').find('td:nth-child(4)').text();

    // Set the values in the modal input fields
    $('#itemName').val(itemName);
    $('#quantity').val(quantity);
    $('#unitOfMeasurement').val(unitOfMeasurement);

    // Update the hidden input field with the item ID
    $('#itemId').val(itemId);

    // Show the update modal
    $('#updateModal').modal('show');
}

// Function to submit the update form
function submitUpdate() {
    // Get form data
    var formData = $('#updateItemForm').serialize();
    // Get the item ID from the hidden input field
    var itemId = $('#itemId').val();
    // AJAX POST request to update item
    $.ajax({
        type: 'POST',
        url: "/update_inventory_item/" + itemId, // Ensure the correct URL is used
        data: formData,
        success: function (response) {
            // Handle success response
            console.log('Item updated successfully.');
            console.log('Updated item:', response); // Log the updated item value
            // You can update the UI or perform other actions here
            $('#updateModal').modal('hide'); // Hide the modal after successful update
            // Reload the table to reflect the changes
            refreshTable();
        },
        error: function (xhr, status, error) {
            // Handle error response
            console.error('Error updating item:', error);
            // You can show an error message to the user or perform other actions here
        }
    });
}

// Function to refresh the table data dynamically
function refreshTable() {
    // Perform an AJAX request to fetch updated table data
    $.ajax({
        type: 'GET',
        url: '/get_updated_table_data', // Replace with the URL to fetch updated table data
        success: function (data) {
            // Update the table body with the new data
            $('#tableBody').html(data);
        },
        error: function (xhr, status, error) {
            // Handle error response
            console.error('Error refreshing table:', error);
            // You can display an error message or handle the error as needed
        }
    });
}