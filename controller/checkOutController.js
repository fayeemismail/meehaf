const cartSchema = require('../models/cartModel');
const addressSchema = require('../models/addressModel');
const UserSchema = require('../models/userModel');
const orderSchema = require('../models/orderModel');
const productSchema = require('../models/productModel')
const couponSchema = require('../models/couponModel')
const { ObjectId } = require('mongodb');




const checkOut = async (req,res) => {
    try {
        const userId = req.session.user_id;
        const userData = await UserSchema.findOne({_id:userId});
        const userAddress = await addressSchema.findOne({ user_id: userId});

        const addresses = userAddress && userAddress.address ? userAddress.address : [];

        const cartData = await cartSchema.findOne({user:userId}).populate('Products.Product');

        if(cartData){
            res.render('checkOut', { userData: userData, addresses: addresses, cartData: cartData.Products })
            
        }else{
            res.render('checkOut', { userData: userData, addresses: addresses, cartData: [] })
        }

    } catch (error) {
        console.log(error)
    }
}


const placeOrder = async (req, res) => {
    try {
        const { checkAddress, couponCode } = req.body;
        
        const userId = req.session.user_id;
        const userData = await UserSchema.findOne({ _id: userId });

        const addressData = await addressSchema.findOne({ user_id: userId });
        const correctAddress = addressData.address.find(value => value.id == checkAddress ? value : '');

        const findCart = await cartSchema.findOne({ user: userId }).populate('Products.Product');

        const productDetails = findCart.Products.map(val => ({
            Product: val.Product.id,
            name: val.Product.name,
            quantity: val.quantity,
            price: val.Product.price
        }));

        // Check stock availability
        for (let i = 0; i < productDetails.length; i++) {
            const product = await productSchema.findById(productDetails[i].Product);

            if (product.stock < productDetails[i].quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name}` });
            }
        }

        // Deduct stock quantities
        for (let i = 0; i < productDetails.length; i++) {
            const product = await productSchema.findById(productDetails[i].Product);
            product.stock -= productDetails[i].quantity;
            await product.save();
        }

        let totalAmount = 0;
        let discountAmount = 0;
        let productPrice = 0;

        if (couponCode) {
            const couponData = await couponSchema.findOne({ couponCode });

            if (couponData) {
                discountAmount = couponData.amount;
                productPrice = productDetails.reduce((accu, val) => {
                    return accu + val.quantity * val.price;
                }, 0);
                totalAmount = productPrice - discountAmount;
            } else {
                totalAmount = productDetails.reduce((accu, val) => {
                    return accu + val.quantity * val.price;
                }, 0);
            }
        } else {
            totalAmount = productDetails.reduce((accu, val) => {
                return accu + val.quantity * val.price;
            }, 0);
        }

        const newOrderData = {
            user: userId,
            Products: productDetails,
            billingAddress: {
                userName: correctAddress.name,
                email: userData.email,
                address: correctAddress.address,
                city: correctAddress.city,
                state: correctAddress.state,
                pincode: correctAddress.pincode,
                mobile: correctAddress.mobile
            },
            paymentMethod: 'COD',
            totalAmount: totalAmount,
            orderStatus: 'Pending'
        };

        if (couponCode) {
            const couponData = await couponSchema.findOne({ couponCode });

            if (couponData) {
                couponData.userList.push({ userId, couponUsed: true });
                await couponData.save();

                // Add the claimedAmount field only if a coupon is used
                newOrderData.claimedAmount = discountAmount;
            }
        }

        const newOrder = new orderSchema(newOrderData);
        const saving = await newOrder.save();

        if (saving) {
            // Clear the cart after the order is saved
            await cartSchema.findOneAndDelete({ user: userId });
            res.json({ success: true, orderId: saving._id });  // Return order ID
            console.log('saving new order');
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
};




const orderSuccess = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await orderSchema.findById(orderId).populate('Products.Product')

        
        const productDetails = order.Products.map(item => item.Product)
        const items = await productSchema.find({_id:productDetails})
        

        res.render('orderSuccess', { cartData:order });
    } catch (error) {
        console.log(error);
    }
};


module.exports = {
    checkOut,
    placeOrder,
    orderSuccess
    
}