# Hubspot Integration
This collection of endpoints allows the Store to generate events in Hubspot.
Events appear against hubspot contacts after they have registered or purchases a product. 

## Authentification
To send events Hubspot requires OAuth for authification.

OAuth works by the user requesting an initial token upon manually installing the application into the hubspot account.

This auth token has an expiry date (~6h). After this time you can request to refresh by using the access initial access token provided.

Given this is a serverless project that creates a problem for us as we don't have a way to persist the token between functions or session. To get aroudn this problem we use an S3 bucket to store objects that contain the returned token. We then query the S3 bucket when accessing the token.

### Process
1. To begin visit `/api/hubspot/authorise` this will return a single link to authorise the Hubspot application.
2. The Hubspot Auth page returns the user to `/api/hubspot/authCallback?token={AUTH_TOKEN}`. 
3. We extract the `{AUTH_TOKEN}` and exchange it for an access token.
4. The access token is stored in S3 with an expiration date.
5. When the application requires a token it fetches the latest token from S3. Checks whether it's still active and returns if it is. If the token has expired we use the expired token to refresh and create a new token which we then persist to S3 and return the new tokn.