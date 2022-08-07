import { buffer } from 'micro';
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

import {constructStripeEvent, checkStripeEvent, incrementPayment} from './stripeHelpers.js';

// Vercel does some maginc with the body which meant we couldn't get the raw body contents to verify. 
// The buffer stuff comes from here https://github.com/vercel/vercel/discussions/5213
module.exports = (req, res) => {
    buffer(req)
    .then(buf => {
        const sig = req.headers['stripe-signature'];
        const payload = buf.toString();
        return [payload, sig]
    })
    .then(constructStripeEvent)
    .then(checkStripeEvent)
    .then(([eventType, event, product]) => {
        if(eventType!= "INSTALLMENT"){res.send({status: "Ok"})}
        else {
            incrementPayment(event)
            .then(() => res.send({status: "Ok"}))
            .catch(err => {
                console.error(err)
                res.status(400)
                res.send({
                    status: "Error",
                    message: "Error validating webhook."
                })
            })
        }
    })
    .catch(err => {
        console.error(err)
        res.status(400)
        res.send({
            status: "Error",
            message: "Error validating webhook."
        })
    })
    
}