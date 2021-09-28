const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = (req, res) => {
    console.debug("/getProducts")

    async function getProductsFromStripe(){
        return await stripe.products.list({
            active: true,
            limit: 100,
        });
    }

    async function getProductPrices(products){
        const promises = products.map(async product => {
            priceData = await stripe.prices.list({product: product.id, active: true})
            if(priceData.data.length > 0){ 
                prices = priceData.data.map(x => (
                    product.price_id = x.id,
                    product.price_metadata = x.metadata,
                    product.price_nickname = x.nickname,
                    product.frequency = x.type === 'recurring' ? x.recurring.interval + "|" + x.recurring.interval_count : x.type,
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
    .then(data => {
        // This filters any products that are null or don't have an active price
        return data.filter((el) => {return (el != null && el.price_id != null)})
    })
    .then((data) =>{
        res.send({
            status: 'Ok',
            products: data
        })
    })

};
