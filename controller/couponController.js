const couponSchema = require('../models/couponModel');


const coupon = async (req,res) => {
    try {
        const couponData = await couponSchema.find({})
        const couponStatus = await couponSchema.find({}).populate('userList.userId')
        console.log(couponStatus.userList)
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







module.exports = {
    addCoupon,
    coupon

}