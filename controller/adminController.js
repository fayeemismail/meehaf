const user = require('../models/userModel');
const category = require('../models/categoryModel');
const products = require('../models/productModel');
const orderSchema = require('../models/orderModel');
const returnSchema = require('../models/returnModel')
const walletSchema = require('../models/walletModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const htmlToPdf = require('html-pdf');
require('dotenv').config();


const home = async (req, res) => {
    try {
        const orderData = await orderSchema.find()
        const deliveredOrders = orderData.filter(order => order.orderStatus == 'Delivered')
        const totalOrders = await orderSchema.aggregate([
            { $match: { orderStatus : 'Delivered' } },
            { $count: 'total' } 
        ])
        
        const totalAmount = await orderSchema.aggregate([
            { $match: { orderStatus : 'Delivered' } },
            { $group: { _id:null, total: { $sum:'$totalAmount' } } }
        ])

        const totalProducts = await products.find().countDocuments();

        const totalCategories = await category.find().countDocuments();

        // Calculate the date 30 days ago from the current date
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const monthlyIncome = await orderSchema.aggregate([
            { 
                $match: { 
                    orderStatus: 'Delivered',
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            { 
                $group: { 
                    _id: null, 
                    total: { $sum: '$totalAmount' } 
                } 
            }
        ]);


        const orderList = await orderSchema.find().sort({_id: -1}).limit(6)

        

        res.render('home', {
            orders: deliveredOrders,
            totalAmount: totalAmount.length ? totalAmount[0].total : 0,
            totalOrders: totalOrders.length ? totalOrders[0].total : 0,
            totalProducts: totalProducts,
            totalCategories: totalCategories,
            monthlyIncome: monthlyIncome.length ? monthlyIncome[0].total : 0,
            orderList: orderList
        });
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
        const limit = 8; // Number of products per page
        const page = parseInt(req.query.page) || 1; // Current page number, default is 1

        const allProducts = await products.find().sort({_id:-1});
        const falseCategories = await category.find({status: false});
        const falseCategoryName = falseCategories.map(categories => categories.name);
        const filteredProducts = allProducts.filter(product => !falseCategoryName.includes(product.category));

        const totalProducts = filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const productsToShow = filteredProducts.slice(startIndex, endIndex);

        res.render('product', {
            item: productsToShow,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error);
    }
}




const order = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; // Default to 5 orders per page
        const skip = (page - 1) * limit;

        const orderList = await orderSchema.find().skip(skip).limit(limit).sort({_id: -1});
        const totalOrders = await orderSchema.countDocuments().sort({_id: -1});

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
        const limit = 5; // Number of users per page
        const page = req.query.page ? parseInt(req.query.page) : 1; // Current page number
        const totalUsers = await user.countDocuments({}); // Total number of users
        const totalPages = Math.ceil(totalUsers / limit); // Total number of pages

        const data = await user.find({})
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({_id:-1});

        res.render('usersList', { data, page, totalPages });

    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
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


const acceptReturn = async (req, res) => {
    try {
        const orderId = req.query.id;
        const returnData = await returnSchema.findOne({ orderData: orderId });
        const orderData = await orderSchema.findOne({ _id: orderId });

        if (returnData) {
            const userId = returnData.user;

            if (orderData.paymentMethod === 'Razor Pay' || orderData.paymentMethod === 'Wallet') {
                const newWallet = new walletSchema({
                    user: userId,
                    amount: orderData.totalAmount,
                    payment_type: 'Credited'
                });

                const saving = await newWallet.save();
                if (saving) {
                    const creditedAmount = await user.findOne({ _id: userId });
                    creditedAmount.balance += orderData.totalAmount;
                    orderData.orderStatus = 'returned';
                    orderData.paymentStatus = 'refund'
                    await orderData.save();
                    await creditedAmount.save();
                    res.status(200).send('Return accepted and amount credited to the wallet');
                }
            } else {
                // If payment method is not 'Razor Pay' or 'Wallet'
                orderData.orderStatus = 'returned';
                orderData.paymentStatus = 'refund'
                await orderData.save();
                res.status(200).send('Return request accepted');
            }
        } else {
            res.status(404).send('Return request not found');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred while processing the return');
    }
};




const denyReturn = async (req, res) => {
    try {
        const orderId = req.query.id;
        const orderData = await orderSchema.findOne({ _id: orderId });

        if (orderData) {
            orderData.orderStatus = 'cannot return';
            await orderData.save();

            res.status(200).send('Return request denied');
        } else {
            res.status(404).send('Order not found');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred while denying the return');
    }
};



const salesReport = async (req, res) => {
    try {
        const { page = 1, limit = 10, dateRange, startDate, endDate } = req.query;
        const skip = (page - 1) * limit;

        // FILTERING DATE BASED ON IN FROTEND 
        let dateFilter = {};
        if (dateRange === 'daily') {
            dateFilter = {
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            };
        } else if (dateRange === 'LastWeek') {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - 6); // START THE DATE FROM LAST 7 DAYS
            const endOfWeek = new Date(today);

            dateFilter = {
                createdAt: {
                    $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
                    $lt: new Date(endOfWeek.setHours(23, 59, 59, 999))
                }
            };
        } else if (dateRange === 'yearly') {
            dateFilter = {
                createdAt: {
                    $gte: new Date(new Date().getFullYear(), 0, 1),
                    $lt: new Date(new Date().getFullYear() + 1, 0, 1)
                }
            };
        } else if (dateRange === 'custom' && startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                }
            };
        }

        // FILTERING THE ORERS ONLY DELIVERED
        const orderFilter = { ...dateFilter, orderStatus: 'Delivered' };

        // Fetch orders with pagination and filters
        const orderList = await orderSchema.find(orderFilter).skip(skip).limit(limit).sort({ _id: -1 });

        // COUNTING EVERY DELIVERED DOCUMENTS
        const totalOrders = await orderSchema.countDocuments(orderFilter);
        const totalSalesCount = totalOrders; 
        const totalOrderAmount = await orderSchema.aggregate([
            { $match: orderFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalDiscount = await orderSchema.aggregate([
            { $match: orderFilter },
            { $group: { _id: null, total: { $sum: "$claimedAmount" } } }
        ]);

        
        res.render('salesReport', {
            orderList: orderList,
            totalSalesCount: totalSalesCount,
            totalOrderAmount: totalOrderAmount.length > 0 ? totalOrderAmount[0].total : 0,
            totalDiscount: totalDiscount.length > 0 ? totalDiscount[0].total : 0,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / limit),
            limit: parseInt(limit),
            dateRange: dateRange || '',
            startDate: startDate || '',
            endDate: endDate || ''
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};












const downloadWithExcel = async (req, res) => {
    try {
        const orderList = await orderSchema.find({});

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Order Number', key: 'orderNumber' },
            { header: 'Name', key: 'userName' },
            { header: 'Email', key: 'email' },
            { header: 'Total Amount', key: 'totalAmount' },
            { header: 'Discount', key: 'discount' },
            { header: 'Status', key: 'orderStatus' },
            { header: 'Date', key: 'createdAt' },
            { header: 'Payment Method', key: 'paymentMethod' },
        ];

        orderList.forEach((order, index) => {
            worksheet.addRow({
                orderNumber: index + 1,
                userName: order.billingAddress.userName,
                email: order.billingAddress.email,
                totalAmount: `₹${order.totalAmount.toFixed(2)}`,
                discount: `₹${order.claimedAmount ? order.claimedAmount.toFixed(2) : '0.00'}`,
                orderStatus: order.orderStatus,
                createdAt: new Date(order.createdAt).toDateString(),
                paymentMethod: order.paymentMethod,
            });
        });

        const filePath = path.join(__dirname, '..', 'public', 'sales_report.xlsx');
        
        // Ensure the directory exists
        const directoryPath = path.dirname(filePath);
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        await workbook.xlsx.writeFile(filePath);
        res.download(filePath, 'sales_report.xlsx');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



const salesChart = async (req, res) => {
    const filter = req.query.filter;
    let matchCondition = { orderStatus: 'Delivered' };
    let groupBy;

    const now = new Date();
    let startDate;

    if (filter === 'daily') {
        startDate = new Date(now.setDate(now.getDate() - 30));
        groupBy = { $dayOfMonth: '$createdAt' };
    } else if (filter === 'weekly') {
        startDate = new Date(now.setDate(now.getDate() - 7));
        groupBy = { $week: '$createdAt' };
    } else if (filter === 'monthly') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        groupBy = { $month: '$createdAt' };
    } else if (filter === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = { $year: '$createdAt' };
    } else {
        return res.status(400).send('Invalid filter type');
    }

    matchCondition.createdAt = { $gte: startDate };

    try {
        const salesData = await orderSchema.aggregate([
            { $match: matchCondition },
            { $group: { _id: groupBy, total: { $sum: '$totalAmount' } } },
            { $sort: { _id: 1 } }
        ]);

        const labels = salesData.map(data => data._id);
        const values = salesData.map(data => data.total);

        res.json({ labels, values });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};





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
    acceptReturn,
    denyReturn,
    salesReport,   
    downloadWithExcel,
    salesChart

    
}