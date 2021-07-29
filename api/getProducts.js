module.exports = (req, res) => {
    res.send({ products: 
        [
            {name: "Product One", price: "10"},
            {name: "Product Two", price: "20"},
            {name: "Product Three", price: "30"},
            {name: "Product Four", price: "40"},
        ]
    });
};