require 'sinatra'
require 'stripe'
require 'socket'
require 'dotenv/load'

Dotenv.load('prod.env')

set :secret_key, ENV['STRIPE_KEY']
Stripe.api_key = settings.secret_key

# You can find your endpoint's secret in your webhook settings
secret = ENV['WEBHOOK_KEY']

menMonthly = ENV['mens']
womensMonthly = ENV['womens']

# By default Sinatra will return the string as the response.
get '/' do
  status 200
  "Welcome to the hillcroftlacrosse.com API."
end

def increment_payments_count(event)
    menMonthly = ENV['mens']
    womensMonthly = ENV['womens']
    
    # Grab the subscription line item.
    sub =  event.data.object.lines.data[0]

    # Execute only for installment plans.
    if sub.plan[:id].eql?(menMonthly) || sub.plan[:id].eql?(womensMonthly)
	p 'Mens playing monthly or Womens playing monthly'

    # Recommendation: Log invoices and check for duplicate events.
    # Recommendation: Note that we send $0 invoices for trials.
    #                 You can verify the `amount_paid` attribute of
    #                 the invoice object before incrementing the count.

        # Retrieve and increment the number of payments.
        if !sub.metadata[:installments_paid].nil?
            count = sub.metadata[:installments_paid].to_i
        else
            count = 0
        end 
        count += 1
        # Metadata is not write-protected; creating a database is an alternative.
        
	# Save incremented value to `installments_paid` metadata of the subscription.
        subscription_object = Stripe::Subscription.update(
          sub[:subscription],
          {
            metadata: {
              installments_paid: count,
            },
          }
        )

        # Check if all 10 installments have been paid.
        # If paid in full, then cancel the subscription.
        if count >= 6
            subscription_object.delete
        end
    end
end


# Responds to webhooks sent by Stripe.
post "/payment-received" do

    # Retrieve the payload from the webhook.
    payload = (request.body.read)

    # Verify signature to be sure that the event came from Stripe.
    signature = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
        event = Stripe::Webhook.construct_event(payload, signature, secret)
    rescue JSON::ParserError => e
        # Invalid payload
        # Recommendation: Log problem for investigation.
	p e
        status 400
        return
    rescue Stripe::SignatureVerificationError => e
        # Invalid signature
        # Recommendation: Log problem for investigation.
	p e
        status 400
        return
    end

    # Respond to Stripe with 200 to acknowledge that the endpoint
    # received the webhook.
    status 200

    # Execute only for `invoice.payment_succeeded` events.
    if event.type.eql?('invoice.payment_succeeded') # && event.
        increment_payments_count(event) # see below
    end

end # post "/webhook" do
