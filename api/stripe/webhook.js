import { buffer } from 'micro';
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

import {constructStripeEvent, checkStripeEvent} from './stripeHelpers.js';
import {sendHubspotTimelineTemplate} from '../hubspot/v2/helpers/hubspotHelpers.js';

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
        if(eventType == null || eventType == ""){res.send({status: "Ok"})}
        else {
            sendHubspotTimelineTemplate([eventType, event, product])
            .then((data) => {console.debug('Data'); console.debug(data)})
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