import {getOrCreateContactByEmail, triggerEvent, updateOrCreateHubspotUser} from './hubspot/v2/helpers/hubspotHelpers.js';


/* module.exports = (req, res) => {
    const { body } = req;
    if( ( !req.body || !('email' in req.body ) || (req.body.email == ""))) {
        res.send({
            status: "Error",
            message: "Must provide customer.email"
        })}
    getOrCreateContactByEmail(req.body)
    .then(data => res.send(data))
    .catch(err => {
        console.error(err)
        res.status(400)
        res.send({
            status: "Error",
            message: err.message
        })
    })
} */

module.exports = (req, res) => {
    const { body } = req;

    updateOrCreateHubspotUser(req.body)
    .then(data => res.send(data))
    .catch(err => {
        console.error((err))
        res.status(400)
        res.send({
            status: 'Error',
            message: "Error triggering event"
        })
    })

}