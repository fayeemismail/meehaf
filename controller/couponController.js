const couponSchema = require('../models/couponModel');
const  userSchema = require('../models/userModel');
const cartSchema = require('../models/cartModel')


const coupon = async (req,res) => {
    try {
        const couponData = await couponSchema.find({})
        
        if(couponData){
            res.render('coupon', {couponData:couponData})
        }else{
            res.render('coupon', {couponData:[]})
        }
        
    } catch (error) {
        console.log(error)
    }
}


const addCoupon = async (req,res) => {
    try {
        
        const {coupon_name, amount, coupon_expires, coupon_code, minimum_amount, coupon_status } = req.body;
        console.log(coupon_status, 'jhfjgrxfv')
        const newCoupon = new couponSchema({
            name:coupon_name,
            amount:amount,
            expires:coupon_expires,
            couponCode:coupon_code,
            minimumAmount:minimum_amount,
            status:coupon_status
        })

        const saving = await newCoupon.save();
        if(saving){
            console.log('new coupon saved');
            res.redirect('/admin/coupon')
        }
        
    } catch (error) {
        console.log(error)
    }
}

const editCoupon = async (req,res) => {
    try {
        const couponId = req.query.id
        const couponData = await couponSchema.findOne({_id:couponId})
        
        res.render('editCoupon', { couponData:couponData })        
    } catch (error) {
        console.log(error)
    }
}


const updateCoupon = async (req,res) => {
    try {
        const { coupon_name, coupon_code, amount, minimum_amount, coupon_expires, coupon_status, couponId } = req.body
        
        const updateCouponData = await couponSchema.findOneAndUpdate( {_id:couponId}, 
            {name:coupon_name, 
            amount:amount, 
            minimumAmount:minimum_amount, 
            expires:coupon_expires, 
            couponCode:coupon_code, 
            status:coupon_status} );


            if(updateCouponData){
                console.log('COUPON DATA UPDATED');
                res.json({success:true})
            }

    } catch (error) {
        console.log(error)
    }
}


const deleteCoupon = async (req,res) => {
    try {
        const {couponId} = req.body
        
        if(couponId){
            const removeCoupon = await couponSchema.findOneAndDelete({_id:couponId});
            if(removeCoupon){
                res.json({success:true})
                console.log('COUPON DATA DELETED')
            }
        }
    } catch (error) {
        console.log(error)
    }
}


const couponCheck = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const couponData = await couponSchema.findOne({ couponCode });

        if (!couponData) {
            return res.send({ message: 'The coupon code is invalid' });
        }
        if(couponData.status == true){
            return res.send({ message: 'the coupon is not available for this moment'})
        }

        const userId = req.session.user_id;

        // Check if the user has already used the coupon
        const usedCoupon = couponData.userList.find(user => user.userId.toString() === userId);

        if (usedCoupon) {
            return res.send({ message: 'You have already used this coupon' });
        }

        // Find the cart data for the user and populate the product details
        const cartData = await cartSchema.findOne({ user: userId }).populate('Products.Product');

        if (!cartData) {
            return res.status(404).send({ message: 'Cart not found' });
        }

        // Calculate the total price of the products in the cart
        let totalPrice = 0;
        cartData.Products.forEach(item => {
            totalPrice += item.Product.price * item.quantity;
        });

        res.send({ success: true, totalPrice });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error' });
    }
};




const couponPage = async (req,res) => {
    const page = parseInt(req.query.page) || 1;
    try {
        const userId = req.session.user_id
        let coupons = await couponSchema.find();
        if(!coupons){
            coupons = [];
        }
        // Check if the user has used each coupon and add the 'used' property
        coupons.forEach(coupon => {
            const userCoupon = coupon.userList.find(userCoupon => userCoupon.userId.toString() === userId);
            coupon.used = userCoupon ? userCoupon.couponUsed : false;
        });
        res.render('couponPage', { coupons, page });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}




const applyCoupon = async (req,res) => {
    try {
        
        const {totalAmount, couponCode} = req.body;
        console.log(totalAmount)
        const couponData = await couponSchema.findOne({couponCode:couponCode})
        if(couponData){
            
            const minimumAmount = couponData.minimumAmount
            if(totalAmount >= minimumAmount){
                const offer = couponData.amount
                const discountAmount = totalAmount - offer
                res.send({success: true, discountAmount})
                
            }else if(couponData.userList){

            }else{
                res.send({fail: `Minimum Purchase amount Required ${couponData.minimumAmount}`})
            }
            
        }
        
        
    } catch (error) {
        console.log(error)
    }
}



const getCoupon = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const couponData = await couponSchema.find({});
        res.json({ couponData, userId }); // Send userId along with couponData
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
};



module.exports = {
    addCoupon,
    coupon,
    editCoupon,
    updateCoupon,
    deleteCoupon,
    couponCheck,
    applyCoupon,
    couponPage,
    getCoupon



}