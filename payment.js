// Payment handling
let paymentModal = null;

function showPaymentModal() {
    if (paymentModal) return;
    
    paymentModal = document.createElement('div');
    paymentModal.className = 'payment-modal';
    paymentModal.innerHTML = `
        <div class="payment-content">
            <h2>Payment Details</h2>
            <button class="close-payment" onclick="closePaymentModal()">&times;</button>
            <form id="payment-form" onsubmit="handlePayment(event)">
                <div class="form-group">
                    <label for="card-holder">Card Holder Name</label>
                    <input type="text" id="card-holder" required 
                           placeholder="John Doe"
                           pattern="[A-Za-z ]{3,}"
                           title="Please enter a valid name (minimum 3 letters)">
                </div>
                <div class="form-group">
                    <label for="card-number">Card Number</label>
                    <div class="card-input-wrapper">
                        <input type="text" id="card-number" required 
                               placeholder="1234 5678 9012 3456" 
                               maxlength="19" 
                               oninput="formatCardNumber(this)"
                               pattern="[0-9 ]{19}"
                               title="Please enter a valid 16-digit card number">
                        <span class="card-type" id="card-type"></span>
                    </div>
                </div>
                <div class="card-details">
                    <div class="form-group">
                        <label for="expiry">Expiry Date</label>
                        <input type="text" id="expiry" required 
                               placeholder="MM/YY" 
                               maxlength="5" 
                               oninput="formatExpiry(this)"
                               pattern="(0[1-9]|1[0-2])\/([0-9]{2})"
                               title="Please enter a valid expiry date (MM/YY)">
                    </div>
                    <div class="form-group">
                        <label for="cvv">CVV</label>
                        <input type="password" id="cvv" required 
                               placeholder="123" 
                               maxlength="3" 
                               oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                               pattern="[0-9]{3}"
                               title="Please enter a valid 3-digit CVV">
                    </div>
                </div>
                <div class="order-summary">
                    <h3>Order Summary</h3>
                    <div id="payment-items"></div>
                    <div class="total">
                        <span>Total Amount:</span>
                        <span id="payment-total"></span>
                    </div>
                </div>
                <button type="submit" class="pay-button">
                    <span class="button-text">Pay Now</span>
                    <div class="button-loader"></div>
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(paymentModal);
    displayPaymentItems();
    
    // Add event listener for clicking outside modal
    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    // Prevent scrolling of background
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    if (paymentModal) {
        paymentModal.remove();
        paymentModal = null;
        document.body.style.overflow = '';
    }
}

function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Add space after every 4 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
    
    // Show card type
    const cardType = document.getElementById('card-type');
    if (cardType) {
        if (value.startsWith('4')) {
            cardType.textContent = '💳 Visa';
        } else if (value.startsWith('5')) {
            cardType.textContent = '💳 MasterCard';
        } else if (value.startsWith('3')) {
            cardType.textContent = '💳 AmEx';
        } else {
            cardType.textContent = '💳';
        }
    }
}

function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Format as MM/YY
    if (value.length >= 2) {
        // Ensure month is between 01 and 12
        let month = parseInt(value.slice(0, 2));
        if (month > 12) month = 12;
        if (month < 1) month = 1;
        month = month.toString().padStart(2, '0');
        
        value = month + (value.length > 2 ? '/' + value.slice(2) : '');
    }
    
    input.value = value;
}

function validateExpiryDate(expiry) {
    const [month, year] = expiry.split('/').map(num => parseInt(num));
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false;
    }
    return true;
}

function displayPaymentItems() {
    const paymentItems = document.getElementById('payment-items');
    const paymentTotal = document.getElementById('payment-total');
    
    if (!paymentItems || !paymentTotal) return;
    
    let total = 0;
    paymentItems.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'payment-item';
        itemElement.innerHTML = `
            <span>${item.name} (${item.quantity}kg)</span>
            <span>${formatPrice(itemTotal)}</span>
        `;
        paymentItems.appendChild(itemElement);
    });
    
    paymentTotal.textContent = formatPrice(total);
}

function startPaymentAnimation() {
    const button = document.querySelector('.pay-button');
    if (button) {
        button.classList.add('processing');
        button.disabled = true;
    }
}

function stopPaymentAnimation() {
    const button = document.querySelector('.pay-button');
    if (button) {
        button.classList.remove('processing');
        button.disabled = false;
    }
}

function handlePayment(event) {
    event.preventDefault();
    
    // Get form values
    const cardHolder = document.getElementById('card-holder').value.trim();
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;
    
    // Validation
    if (!cardHolder.match(/^[A-Za-z ]{3,}$/)) {
        showNotification('Please enter a valid name');
        return;
    }
    
    if (!cardNumber.match(/^\d{16}$/)) {
        showNotification('Please enter a valid 16-digit card number');
        return;
    }
    
    if (!expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        showNotification('Please enter a valid expiry date (MM/YY)');
        return;
    }
    
    if (!validateExpiryDate(expiry)) {
        showNotification('Card has expired');
        return;
    }
    
    if (!cvv.match(/^\d{3}$/)) {
        showNotification('Please enter a valid CVV');
        return;
    }
    
    // Start payment processing
    startPaymentAnimation();
    showNotification('Processing payment...');
    
    // Simulate payment processing
    setTimeout(() => {
        // Success
        const orderNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        
        // Clear cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        // Close modals
        closePaymentModal();
        closeCart();
        
        // Show success message
        showNotification(`Payment successful! Order #${orderNumber} confirmed.`);
        
        // Stop animation
        stopPaymentAnimation();
        
        // Redirect to confirmation page after a delay
        setTimeout(() => {
            showNotification('Thank you for shopping with us!');
        }, 2000);
    }, 2000);
}
