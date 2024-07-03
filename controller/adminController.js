const user = require('../models/userModel');
const category = require('../models/categoryModel');
const products = require('../models/productModel');
const orderSchema = require('../models/orderModel');
require('dotenv').config();


const home = async (req, res) => {
    try {
        res.render('home');
    } catch (error) {
        console.log(error)
    }
}


const login = async (req, res) => {
    try {
        res.render('login');

    } catch (error) {
        console.log(error);
    }
}


const product = async (req, res) => {
    try {
        const allProducts = await products.find();
        const falseCategories = await category.find({status:false});

        const falseCategoryName = falseCategories.map(categories => categories.name);

        const filteredProdcts = allProducts.filter(product => !falseCategoryName.includes(product.category));
        res.render('product', {item:filteredProdcts});

    } catch (error) {
        console.log(error)
    }
}



const order = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; // Default to 5 orders per page
        const skip = (page - 1) * limit;

        const orderList = await orderSchema.find().skip(skip).limit(limit);
        const totalOrders = await orderSchema.countDocuments();

        res.render('order', {
            orderList: orderList,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            limit: limit
        });
    } catch (error) {
        console.log(error);
    }
};











const adminVeify = async (req, res) => {
    try {

        const { userEmail, userPassword } = req.body

        console.log(userEmail, userPassword)
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        console.log(adminEmail, adminPassword)

        if (userEmail !== adminEmail) {
            res.render('login', { message: 'email not match' })
        }

        if (userPassword !== adminPassword) {
            res.render('login', { message1: 'password not match' })
        }
        res.render('home')
    } catch (error) {
        console.log(error)
    }
}

const usersList = async (req, res) => {
    try {

        const data = await user.find({})

        res.render('usersList', { data })

    } catch (error) {
        console.log(error)
    }
}

const userBlock = async (req, res) => {
    try {


        const userId = req.query.id
        const userData = await user.findOne({ _id: userId });
        userData.is_blocked = !userData.is_blocked
        const saving = await userData.save();

        

        if (saving) {
            res.send({ success: 1 })
            console.log(userId + ' blocking or unblocking user')
        }

    } catch (error) {
        console.log(error)
    }
}



const orderDetails = async (req,res) => {
    try {
        const orderId = req.query.id
        const orderData = await orderSchema.findById(orderId).populate('Products.Product')
        res.render('orderDetails', {orderData})
    } catch (error) {
        console.log(error)
    }
}

const cancelOrder = async (req,res) => {
    try {
        const orderId = req.query.id
        const orderData = await orderSchema.findOne({_id:orderId})
        console.log(orderData)
        orderData.orderStatus = 'canceled'
        const saving = await orderData.save();
        if(saving){
            res.send({success: 1})
            console.log('canceling the order in 561')
        }else{
            res.send({success: 0})
        }
    } catch (error) {
        console.log(error)
    }
}


const statusCange = async (req,res) => {
    try {
        const {newStatus, orderId} = req.body
        const orderData = await orderSchema.findById(orderId);
        if(orderData){
            orderData.orderStatus = newStatus
            const saving = await orderData.save();

            if(saving){
                res.send({success:1})
            }
        }
    } catch (error) {
        console.log(error)
    }
}







module.exports = {
    home,
    login,
    product,
    usersList,
    adminVeify,
    userBlock,
    order,
    orderDetails,
    cancelOrder,
    statusCange,
    

}