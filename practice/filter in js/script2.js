const products = [
    {
        name:"Ladies shoes",
        type:"Footwear",
        gender:"F"
    },
    {
        name:"Mens shoes",
        type:"Footwear",
        gender:"M"
    },
    {
        name:"Ladies Dresses",
        type:"Clothes",
        gender:"F"
    },
    {
        name:"Men's shirts",
        type:"Clothes",
        gender:"M"
    },
    {
        name:"Ladies Watches",
        type:"Accessories",
        gender:"F"
    },
    {
        name:"Men's watches",
        type:"Accessories",
        gender:"M"
    }
]

console.log(products)

function filterProducts(product){
    return product[0] == 'L'
}

const handleProductSearch = async(event) => {
    const search = document.getElementById("productSearch").value;
    console.log(search)

    const filteredArray = await products.filter(filterProducts)
    console.log(filteredArray)
}