const hubspot = require('@hubspot/api-client')
const hubspotClient = new hubspot.Client()

import { storeToken } from '../helpers/tokenManagement.js';

module.exports = (req, res) => {

    if(req.query.code){
        // Let's exchange the auth code for a token
        console.debug(req.query.code)
        hubspotClient.oauth.defaultApi.createToken(
            'authorization_code',
            req.query.code,
            process.env.VERCEL_ENV_URL + '/api/hubspot/v2/auth/authCallback',
            process.env.HUBSPOT_CLIENT_ID,
            process.env.HUBSPOT_CLIENT_SECRET)
        // We have a successful auth token. We now need to persist it so other serverless functions can access it.
        .then((results) => storeToken(results.response.body))
        .then((data) => {res.send({
            status: "Ok",
            data: data
        })})
        .catch(err=>{
            console.error(err)
            res.status(400)
            res.send({
                status: "Error",
                message: "Error authorising Hubspot"
            })
        })
    } else {
        res.status(400);
        res.send({
            status: "Error",
            message: "Invalid OAuth callback."
        })
    }

}