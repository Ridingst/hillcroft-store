const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = (req, res) => {
    console.debug("/getProducts")

    async function getProductsFromStripe(){
        return await stripe.products.list({
            active: true
        });
    }

    async function getProductPrices(products){
        const promises = products.map(async product => {
            priceData = await stripe.prices.list({product: product.id, active: true})
            if(priceData.data.length === 0){
                return 
            } else {
                prices = priceData.data.map(x => (
                    product.price_id = x.id,
                    product.price_metadata = x.metadata,
                    product.price_nickname = x.nickname,
                    product.frequency = x.type === 'recurring' ? x.recurring.interval : x.type,
                    product.price = x.unit_amount
                ))
                return product
            }
        })

        return await Promise.all(promises)
    }

    
    getProductsFromStripe()
    .then(apiData => {
        return apiData.data.map(x => ({
            'id': x.id,
            'name': x.name,
            'metadata': x.metadata,
            'description': x.description,
            'image': x.images[0],
        }));
    })
    .then(data => {
        return getProductPrices(data)
    })
    .then((data) =>{
        res.send({
            status: 'Ok',
            products: data
        })
    })

};