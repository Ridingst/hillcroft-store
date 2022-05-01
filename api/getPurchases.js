const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = (req, res) => {
    const { body } = req;

    /* updateOrCreateHubspotUser(req.body)
    .then(data => res.send(data))
    .catch(err => {
        console.error((err))
        res.status(400)
        res.send({
            status: 'Error',
            message: "Error triggering event"
        })
    }) */

    stripe.invoices.search({
        query: 'total>999 AND metadata[\'order_id\']:\'6735\'',
    })
    .then(data => res.send(data))
    .catch(err => { res.send(err)})

}