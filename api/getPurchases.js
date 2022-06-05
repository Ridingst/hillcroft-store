const { read } = require('fs');
const { resolve } = require('path');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

var _ = require('underscore');

async function getInvoices(){
    try{
        const allInvoices = await stripe.invoices.list({
            status: 'paid',
            created: {
                gte: Math.floor(new Date().getTime() / 1000) - (365*24*60*60)
            }
        }).autoPagingToArray({limit: 5000});
        
        return(allInvoices)
    } catch(err){
        throw(err)
    }
};

module.exports = (req, res) => {
    const { body } = req; 
    if(req.query.apiPassword == process.env.apiPassword){
        getInvoices()
        .then(data =>{
            return _.map(data, function(item){
                return {
                    customer: item.customer,
                    customer_email: item.customer_email,
                    customer_name: item.customer_name,
                    amount_paid: item.amount_due,
                    customer_phone: item.customer_phone,
                    product: item.lines.data[0].description,
                    date: item.created
                }
            })
        })
        .then(data => 
            res.send(data)
        )
        .catch(err => {
            console.error((err))
            res.status(400)
            res.send({
                status: 'Error',
                message: "Error triggering event"
            })
        })

    } else {
        res.status(401);
        res.send("Not Authorized")
    }

    
} 