const hubspot = require('@hubspot/api-client')
import { retrieveValidToken } from './tokenManagement.js'

/*
*
* Expect the customer object in format
* {
*   "email": "bcooper@biglytics.net",
*   "firstname": "Bryan",
*   "lastname": "Cooper",
*   "phone": "(877) 929-0687",
*   "stripeId": "cust-12343rfe"
* };
*
*/


export async function updateOrCreateHubspotUser(hubspotClient, customer){
    return new Promise((resolve, reject) => {
        console.debug('updateOrCreateHubspotUser')
        hubspotClient.crm.contacts.basicApi.update(customer.email,  {properties: customer}, "email")
        .then(response => {console.debug('updated existing user'); resolve(response)})
        .catch(err => {
            if(err.response.statusCode === 404){
                hubspotClient.crm.contacts.basicApi.create( { properties: customer})
                .then((customer)=> resolve(customer))
                .catch(err => reject(err))
            } else {
                reject(err)
            }
        })
    })
}

export async function getHubspotClient(){
    return new Promise((resolve, reject) => {
        retrieveValidToken()
        .then(token => {
            let hubspotClientConfig = new hubspot.Client({
                accessToken: token.access_token,
                defaultHeaders: {'authorization': 'Bearer ' + token.access_token}
            })
            hubspotClientConfig.setAccessToken(token.access_token)
            resolve(hubspotClientConfig)
        })
        .catch(err => {
            console.error(err)
            reject('Error connecting to hubspot')
        })
    })
}

export async function registerEvent(hubspt, customer, event){
    return new Promise((resolve, reject) => {
        resolve()
    })
}

export async function sendHubspotTimelineTemplate([eventType, event, product]){
    return new Promise((resolve, reject) => {
        console.debug('sendHubspotTimelineTemplate')
        console.debug({
            eventType: eventType,
            event: event.data.object,
            product: product
        })

        switch (eventType) {
            case 'PURCHASE':
                console.log('Firing PURCHASE')
                getHubspotClient()
                .then(hubspot => {
                    console.debug('sending timeline event')
                    hubspot.crm.timeline.eventsApi.create({ 
                        eventTemplateId: process.env['HUBSPOT_EVENT_TEMPLATE_' + eventType],
                        email: event.data.object.customer_details.email,
                        tokens: { productName: product.description, productId: product.id, priceId: product.price.id, price: product.price.unit_amount / 100, frequency: product.price.type }
                    })
                    .then(data=>resolve(data))
                    .catch(err =>{
                        console.error(err)
                        reject(err)
                    })
                })
                .catch(err => {
                    console.error(err);
                    reject("Error loading hubspot template")
                })
            break;
            default:
            // Unhandled event type
            resolve();
        }
    })
}