function showHideForms() {
    var hourlyFields = document.getElementById('hourly_fields');
    var salaryFields = document.getElementById('salary_fields');
    var hourlyRadio = document.getElementById('hourly');
    var salaryRadio = document.getElementById('salary');

    if (hourlyRadio.checked) {
        // Reset salary fields to default values
        document.getElementById('salary_input').value = 0;
        // Show hourly fields
        hourlyFields.style.display = "block";
        // Hide salary fields
        salaryFields.style.display = "none";
    } else if (salaryRadio.checked) {
        // Reset hourly fields to default values
        document.getElementById('hourly_rate').value = 0;
        document.getElementById('hours').value = 0;
        document.getElementById('cash_tips').value = 0;
        // Show salary fields
        salaryFields.style.display = "block";
        // Hide hourly fields
        hourlyFields.style.display = "none";
    }
}s