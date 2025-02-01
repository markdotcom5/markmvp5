// public/js/stripe-integration.js

// Initialize Stripe using the publishable key from the environment
const stripe = Stripe(process.env.STRIPE_API_KEY || 'placeholder_key'); // Use environment variable

// Initialize Stripe Elements
const elements = stripe.elements();
const card = elements.create('card', {
    style: {
        base: {
            color: '#FFFFFF',
            fontFamily: '"Inter", sans-serif',
            fontSize: '16px',
            '::placeholder': {
                color: '#6B7280', // Placeholder text color
            },
        },
    },
});

// Mount the card input field
card.mount('#card-element');

// Handle card input validation and errors
card.on('change', ({ error }) => {
    const displayError = document.getElementById('card-errors');
    if (error) {
        displayError.textContent = error.message; // Display error message
    } else {
        displayError.textContent = ''; // Clear error message
    }
});

// Event listeners for subscription logic remain unchanged

// Add event listeners to plan selection buttons
document.querySelectorAll('[data-plan]').forEach(button => {
    button.addEventListener('click', async (e) => {
        e.preventDefault();

        const planType = button.getAttribute('data-plan');
        const loading = document.getElementById('payment-processing'); // Spinner element
        const cardErrors = document.getElementById('card-errors');

        try {
            // Show loading spinner and disable the button
            loading.classList.remove('hidden');
            button.disabled = true;

            // Create a payment method using the card input
            const { paymentMethod, error: paymentError } = await stripe.createPaymentMethod({
                type: 'card',
                card,
            });

            if (paymentError) throw paymentError; // Handle payment method creation errors

            // Send payment method and plan to the server
            const response = await fetch('/api/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethodId: paymentMethod.id,
                    plan: planType,
                }),
            });

            if (!response.ok) throw new Error('Failed to create subscription. Please try again.');

            const { clientSecret } = await response.json();

            // Confirm the payment
            const { error: confirmationError } = await stripe.confirmCardPayment(clientSecret);

            if (confirmationError) throw confirmationError; // Handle payment confirmation errors

            // Update the personalized countdown timeline
            updatePersonalCountdown(planType);

            // Show success modal
            const successModal = document.getElementById('success-modal');
            if (successModal) {
                successModal.showModal(); // Ensure the modal exists before calling
            }

        } catch (error) {
            // Display any errors to the user
            cardErrors.textContent = error.message || 'An error occurred. Please try again.';
            console.error('Subscription Error:', error);
        } finally {
            // Hide loading spinner and re-enable the button
            loading.classList.add('hidden');
            button.disabled = false;
        }
    });
});