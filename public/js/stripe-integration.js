// public/js/stripe-integration.js

const stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);
const elements = stripe.elements();
const card = elements.create('card', {
   style: {
       base: {
           color: '#FFFFFF',
           fontFamily: '"Inter", sans-serif',
           fontSize: '16px',
           '::placeholder': {
               color: '#6B7280',
           },
       },
   }
});

card.mount('#card-element');

card.on('change', ({error}) => {
   const displayError = document.getElementById('card-errors');
   if (error) {
       displayError.textContent = error.message;
   } else {
       displayError.textContent = '';
   }
});

document.querySelectorAll('[data-plan]').forEach(button => {
   button.addEventListener('click', async (e) => {
       e.preventDefault();
       const planType = button.getAttribute('data-plan');
       const loading = document.getElementById('payment-processing');
       
       try {
           loading.classList.remove('hidden');
           button.disabled = true;

           const { paymentMethod } = await stripe.createPaymentMethod({
               type: 'card',
               card
           });

           const response = await fetch('/api/subscription/create', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   paymentMethodId: paymentMethod.id,
                   plan: planType
               })
           });

           const { clientSecret } = await response.json();
           const { error } = await stripe.confirmCardPayment(clientSecret);

           if (error) throw error;

           // Update timeline
           updatePersonalCountdown(planType);
           document.getElementById('success-modal').showModal();
           
       } catch (error) {
           document.getElementById('card-errors').textContent = error.message;
       } finally {
           loading.classList.add('hidden');
           button.disabled = false;
       }
   });
});