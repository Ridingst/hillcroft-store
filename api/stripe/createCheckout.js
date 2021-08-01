const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = (req, res) => {

    if(!('product' in req.query || 'frequency' in req.query || req.query.product === '' )){
        console.error(req.query)
        res.status(400)
        res.send({status: "Error", message: "Invalid request"})
    } else {
        console.log('Valid request')
        async function createSession(productId){
            return await stripe.checkout.sessions.create({
                mode: (frequency === 'month') ? 'subscription' : 'payment'
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

        createSession(req.query.product)
        .then((session) => {
            console.log('sending session url: ' + session.url)
            res.send({
                status: 'Ok',
                sessionUrl: session.url
            })
        }).catch((err) => {
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