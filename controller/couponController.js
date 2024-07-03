const couponSchema = require('../models/couponModel');


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


module.exports = {
    addCoupon,
    coupon,
    editCoupon,
    updateCoupon,
    deleteCoupon,



}