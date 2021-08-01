const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function findUser(email){
  return await stripe.customers.list({
    email: email.toLowerCase(),
    limit: 1,
  })
}

async function createUser(email, name){
  return await stripe.customers.create({
    email: email.toLowerCase(),
    name: name
  });
}

async function getOrCreateStripeUser(email, name) {
  console.debug('getOrCreateStripeUser: ' + email)
  customer = await findUser(email)
  
  if (customer.data.length === 0) {
    // Then we should create a user
    console.debug('No user found, creating new user')
    customer = await createUser(email, name)
    return {
      id: customer.id,
      email: customer.email
    }
  } else {
    console.debug("User found, returning")
    console.debug(customer)
    return {
      id: customer.data[0].id,
      email: customer.data[0].email
    }
  }
}

async function createSession(productId, frequency, customer) {
  return await stripe.checkout.sessions.create({
    mode: (frequency.split("|")[0] === 'month') ? 'subscription' : 'payment',
    customer: customer.id,
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
    success_url: 'https://' + (process.env.URL != null ? process.env.URL : process.env.VERCEL_URL) + '?success=true&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://' + (process.env.URL != null ? process.env.URL : process.env.VERCEL_URL) + '?error',
  });
}

module.exports = (req, res) => {
  console.debug("/createCheckout")
  const { body } = req;

  if (!('product' in req.body) || !('frequency' in req.body) || req.body.product === '' || req.body.frequency === '' || !('name' in req.body) || !('email' in req.body) || req.body.name === '' || req.body.email === '') {
    console.error(req.body)
    res.status(400)
    res.send({ status: "Error", message: "Invalid request" })
  } else {
    console.debug('Valid request')
    getOrCreateStripeUser(req.body.email, req.body.name)
    .then(customer => {
      createSession(req.body.product, req.body.frequency, customer)
      .then((session) => {
        console.log('sending session url: ' + session.url)
        res.send({
          status: 'Ok',
          sessionUrl: session.url
        })
      }).catch((err) => {
        console.error("Stripe Error: " + err.message)
        res.status(400)
        res.send({
          status: 'Error',
          message: err.message
        })
      })
    })
    
    
    // Redirect to the URL returned on the Checkout Session.
    // With express, you can redirect with:
    //   res.redirect(303, session.url);
  }
}