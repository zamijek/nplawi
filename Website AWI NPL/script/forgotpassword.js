
// //LUPA PASSWORD
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Clear previous messages
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');

    try {
        // Kirim request ke backend untuk reset password
        const response = await fetch('http://localhost:3000/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            successMessage.classList.remove('hidden');
        } else {
            errorMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.classList.remove('hidden');
    }
});
