const Products = require('../models/productModel');
const cart = require('../models/cartModel');
const categorySchema = require('../models/categoryModel');
const { product } = require('./adminController');


const showCart = async (req, res) => {
    try {
        const userData = req.session.user_id;
        if(userData.is_blocked == true){
            req.session.destroy()
        }
        const cartData = await cart.findOne({ user: userData }).populate('Products.Product');
        
        // Find all unlisted products (where status is true)
        const unlistedProducts = await Products.find({ status: true })
        const unlistedProductIds = unlistedProducts.map(product => product._id.toString());

        if (cartData && cartData.Products && cartData.Products.length > 0) {
            // Filter out the unlisted products from the cart
            const filteredProducts = cartData.Products.filter(cartItem => {
                return !unlistedProductIds.includes(cartItem.Product._id.toString());
            });

            // Update the cart with filtered products
            cartData.Products = filteredProducts;
            await cartData.save();
        }

        if (!cartData || !cartData.Products || cartData.Products.length === 0) {
           
            res.render('cart', { cartData: { Products: [] } }); 
        } else if (cartData) {
          
            res.render('cart', { cartData: cartData });
        }
    } catch (error) {
        console.log(error);
        // Handle other errors as needed
        res.status(500).send('Error fetching cart data');
    }
};



const checkCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const cartData = await cart.findOne({ user: req.session.user_id });

        if (!cartData) {
            const addToCart = new cart({
                user: req.session.user_id,
                Products: [{
                    Product: productId,
                    quantity: 1
                }]
            });
            await addToCart.save();
            res.status(200).json({ success: 'The product has been added to the cart' });
        } else {
            const exist = cartData.Products.find(item => {
                return item.Product == productId;
            });
            if (exist) {
                res.status(200).json({ fail: 'The product is already in the cart' });
            } else {
                cartData.Products.push({ Product: productId, quantity: 1 });
                const saving = await cartData.save();
                if (saving) {
                    res.status(200).json({ success: 'The product has been added to the cart' });
                }
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
}



const addCart = async (req, res) => {

    try {
        const { productId, quantity } = req.body
        const cartData = await cart.findOne({ user: req.session.user_id });

        if (!cartData) {
            const addToCart = new cart({
                user: req.session.user_id,
                Products: [{
                    Product: productId,
                    quantity: quantity
                }]
            });
            await addToCart.save()

        } else {

            const exist = cartData.Products.find(item => {
                return item.Product == productId
            })

            if (exist) {
                res.status(200).json({ fail: 'The Product Already In The Cart' })
            } else {
                cartData.Products.push({ Product: productId, quantity: quantity });
                const saving = await cartData.save();
                if (saving) {
                    console.log('the product is adding to cart')

                    res.status(200).json({ success: 'The Product Has Been Added To Cart' });
                }
            }

        }

    } catch (error) {
        console.log(error)
    }

}



const removeCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user_id; // Assuming you have user authentication and can get the user ID



        // Update the cart by removing the product
        const result = await cart.updateOne(
            { user: userId },
            { $pull: { Products: { Product: productId } } }
        );


        if (result.nModified > 0) {
            console.log('Product removed successfully');
            res.json({ success: true });
        } else {
            console.log('Product not found in cart or not removed');
            res.json({ success: false, message: 'Product not found in cart or not removed' });
        }
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



const increament = async (req, res) => {
    try {
        const { productId, stock } = req.body;
        const userId = req.session.user_id;

        const findProductCart = await cart.findOne({ user: userId });


        const product = await Products.findOne({ _id: productId });
        if (!product) {
            console.log('product is not in the cart')
        }

        if (product.stock < stock) {
            return res.send({ error: 1 })
        }
        if (3 < stock) {
            return res.send({ error: 2 })
        }

        const stockCheck = findProductCart.Products.forEach(item => {
            if (item.Product == productId) {
                if (stock <= product.stock) {
                    item.quantity = stock
                } else {
                    return stock = product.stock
                }
            }
        });

        const saveIncrQuantity = await findProductCart.save();
        if (saveIncrQuantity) {
            const total = stock * product.price
            return res.send({ stock: stock, total: total })
        }

    } catch (error) {
        console.log(error)
    }
}




const decrement = async (req, res) => {
    try {
        let { productId, stock } = req.body;
        const userId = req.session.user_id;

        const findProductCart = await cart.findOne({ user: userId });

        const product = await Products.findOne({ _id: productId });

        findProductCart.Products.forEach(item => {
            if (item.Product == productId) {
                if (stock <= product.stock) {
                    item.quantity = stock
                } else {
                    return stock = item.quantity
                }
            }
        })

        const saveDecrQuantity = await findProductCart.save();
        if (saveDecrQuantity) {
            const total = stock * product.price
            return res.send({ stock: stock, total: total })
        }

    } catch (error) {
        console.log(error)
    }
}


const subtotal = async (req, res) => {
    try {
        const userId = req.session.user_id

        const findCart = await cart.findOne({ user: userId }).populate('Products.Product');

        if (findCart) {
            res.send({ productData: findCart.Products })
        }else{
            res.send({productData: []})
        }


        
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    checkCart,
    addCart,
    showCart,
    removeCart,
    increament,
    decrement,
    subtotal

}