const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export async function getStripeUser(customer){
    return new Promise((resolve, reject) => {
        stripe.customers.list({
            email: customer.email.toLowerCase(),
            limit: 1,
        })
        .then(data => (data.data.length > 0) ? resolve(data.data[0]) : resolve([]))
        .catch(err => reject(err))
    })
}

export async function createStripeUser(customer){
    return new Promise((resolve, reject) => {
        stripe.customers.create({
            email: customer.email.toLowerCase(),
            name: customer.firstname + ' ' + customer.lastname,
            phone: customer.phone
        })
        .then(data => resolve(data))
    })
}

export async function getOrCreateStripeUser(customer){
    return new Promise((resolve, reject) => {
        getStripeUser(customer)
        .then(stripeUser => {
            if(stripeUser.object == 'customer'){ console.debug('stripe user found returning'); resolve(stripeUser) }
            else {
                console.debug('Creating stripe User')
                createStripeUser(customer)
                .then(stripeUser => resolve(stripeUser))
            }
        })
        .catch(err => reject(err))
    })
}

export async function createStripeSession(productId, frequency, stripeCustomerID) {
    return new Promise((resolve, reject) => {
        stripe.checkout.sessions.create({
            mode: (frequency.split("|")[0] === 'month') ? 'subscription' : 'payment',
            customer: stripeCustomerID,
            payment_method_types: ['card'],
            line_items: [
              {
                price: productId,
                // For metered billing, do not pass quantity
                quantity: 1,
              },
            ],
            // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
            // the actual Session ID is returned in the query parameter when your customer
            // is redirected to the success page.
            success_url: process.env.VERCEL_ENV_URL + '/api/hubspot/v2/auth/authCallback' + '?success=true&session_id={CHECKOUT_SESSION_ID}',
            cancel_url: process.env.VERCEL_ENV_URL + '/api/hubspot/v2/auth/authCallback' + '?error',
        })
        .then(session => resolve(session))
        .catch(err => reject(err))
    }) 
  }

export async function constructStripeEvent([payload, sig]){
    return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_ENDPOINT_SECRET)
}

export async function getCheckoutProduct(event){
    return new Promise((resolve, reject) => {
        stripe.checkout.sessions.listLineItems(event.data.object.id)
        .then(lineItems => {
            resolve(lineItems.data[0])
        })
        .catch(reject)
    })
}

export async function checkStripeEvent(event){
    return new Promise((resolve, reject) => {
        switch (event.type) {
            case 'checkout.session.completed':
              // Payment is successful and the subscription is created.
              // You should provision the subscription and save the customer ID to your database.

              // We need to fetch the line items from the checkout session
              getCheckoutProduct(event)
              .then(product => {
                resolve(['PURCHASE', event, product]);
              })
              .catch(reject);
              break;
            case 'invoice.paid':
              // Continue to provision the subscription as payments continue to be made.
              // Store the status in database and check when a user accesses your service.
              // This approach helps you avoid hitting rate limits.
              resolve([]);
              break;
            case 'invoice.payment_failed':
              // The payment failed or the customer does not have a valid payment method.
              // The subscription becomes past_due. Notify your customer and send them to the
              // customer portal to update their payment information.
              resolve([]);
              break;
            default:
              // Unhandled event type
              resolve([]);
          }
    })
}