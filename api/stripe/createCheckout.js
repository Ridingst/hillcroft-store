const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = (req, res) => {
    console.debug("/createCheckout")
    const { body } = req;

    if(!('product' in req.body) || !('frequency' in req.body) || req.body.product === '' || req.body.frequency === '' || !('name' in req.body) || !('email' in req.body) || req.body.name === '' || req.body.email === ''){
        console.error(req.body)
        res.status(400)
        res.send({status: "Error", message: "Invalid request"})
    } else {
        console.debug('Valid request')
        async function createSession(productId){
            return await stripe.checkout.sessions.create({
                mode: (req.body.frequency === 'month') ? 'subscription' : 'payment',
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
                success_url: process.env.VERCEL_URL+'?success=true&session_id={CHECKOUT_SESSION_ID}',
                cancel_url: process.env.VERCEL_URL+'?success=false',
            });
        }

        createSession(req.body.product)
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
        
        // Redirect to the URL returned on the Checkout Session.
        // With express, you can redirect with:
        //   res.redirect(303, session.url);
    } 
}