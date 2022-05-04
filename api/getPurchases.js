const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

var _ = require('underscore');

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

    stripe.invoices.list({
        status: 'paid',
        created: {
            gte: Math.floor(new Date().getTime() / 1000) - (365*24*60*60)
        },
        limit: 100
      })
    //.then(data => {
    //    res.send(_.max(data.data, function(invoice){ return invoice.lines.total_count; }))
    //})
    .then(data => 
        res.send(data)
    )
    .catch(err => { res.send(err)})

}