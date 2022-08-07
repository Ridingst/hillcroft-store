const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

import {getOrCreateStripeUser, createStripeSession} from './stripe/stripeHelpers.js'
import {updateOrCreateHubspotUser, getHubspotClient} from './hubspot/v2/helpers/hubspotHelpers.js'

module.exports = (req, res) => {

  Error.stackTraceLimit = 20;

  console.debug("/createCheckout")
  const { body } = req;

  let cust


  let customerObj = {
    email: req.body.email,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    phone: req.body.phone,
  };

  let hubspot = null;


  if (!('product' in req.body) || !('frequency' in req.body) || req.body.product === '' || req.body.frequency === '' || !('firstname' in req.body) || !('lastname' in req.body) || !('email' in req.body) || req.body.firstname === '' || req.body.lastname === '' || req.body.email === '') {
    console.error(req.body)
    res.status(400)
    res.send({ status: "Error", message: "Invalid request" })
  } else {
    getOrCreateStripeUser(req.body)
    .then(stripeUser => {
      customerObj.stripeid = stripeUser.id;
      return customerObj
    })
    .then(customer => {
      return updateOrCreateHubspotUser(customer)
    })
    .then(hubspotUser => {
      //customerObj.hubspotid = hubspotUser.response.body.id;
      return createStripeSession(req.body.product, req.body.frequency, customerObj.stripeid, customerObj.email)
    })
    .then(session => res.send({status: "Ok", sessionUrl: session.url}))
    .then(() => {
      return updateOrCreateHubspotUser(hubspot, customerObj)
    })
    .catch(err => {
      console.error(err)
      res.status(400)
      res.send({
        status: "Error",
        message: "Error creating the stripe session"
      })
    })
  }
}
