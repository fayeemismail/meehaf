const  userSchema = require('../models/userModel');
const productSchema = require('../models/productModel');
const categorySchema = require('../models/categoryModel');
const offerSchema = require('../models/offeModel');
const { disconnect } = require('mongoose');


const offer = async (req, res) => {
    try {
        // Fetch all offers from the database
        const offerData = await offerSchema.find().sort({_id:-1})

        // Array to hold offers with non-zero amounts
        const remainingOffers = [];

        // Current date for checking expiration
        const currentDate = new Date().toISOString().split('T')[0];

        // Iterate through the offers
        for (const offer of offerData) {
            // Convert the endDate to the same format as currentDate
            const offerEndDate = new Date(offer.endDate).toISOString().split('T')[0];

            // Check if the offer amount is 0 or if the offer is expired
            if (offer.amount === 0 || offerEndDate < currentDate) {
                // If expired, delete the offer and update the product's offer field to 0
                await offerSchema.deleteOne({ _id: offer._id });
                await productSchema.updateOne(
                    { _id: offer.product },
                    { $set: { offer: 0 } }
                );
            } else {
                // Add the offer to the remaining offers array
                remainingOffers.push(offer);
            }
        }

        // Render the offer page with the remaining offers
        res.render('offerPage', { offerData: remainingOffers });
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};



const offerProduct = async (req, res) => {
    try {
        const productData = await productSchema.find()
        res.render('offerProduct', {productData})
    } catch (error) {
        console.log(error)
    }
}

const addProductOffer = async (req, res) => {
    try {
       const { productId, expireDate, type, percentage } = req.body;
       const offerData = await offerSchema.find({product:productId});
       
       const productData = await productSchema.findOne({_id:productId});
       //CHECK IS THERE ANY OFFER TO THAT PRODUCT IF THERE IS DELETE THE OFFER
       if(offerData.length > 0){
        const deleteOffer = await offerSchema.deleteOne({product:productId});
        if(deleteOffer){
            productData.offer = 0
            await productData.save()
        }
       }


       let discountAmount = 0

       if(percentage == 0){
            productData.offer = 0
            await productData.save()
       }else{
            discountAmount = ( productData.price * percentage ) / 100
            productData.offer = Math.round( productData.price - discountAmount )
            await productData.save()
       }

       const newOffer = {
        product: productId,
        type: type,
        endDate: expireDate,
        amount: discountAmount
       }

       const newOfferSchema = new offerSchema(newOffer);
       const savingOffer = await newOfferSchema.save()
       if(savingOffer){
        res.json({success:true})
       }

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};




const categoryOffer = async (req,res) => {
    try {
        const categoryData = await categorySchema.find()
        res.render('categoryOffer', {categoryData})
    } catch (error) {
        console.log(error)
    }
}


const addCategoryOffer = async (req, res) => {
    try {
        const { categoryId, expireDate, type, percentage } = req.body;
        const offerData = await offerSchema.findOne({ category: categoryId });
        const categoryData = await categorySchema.findOne({ _id: categoryId });
        
        let discountAmount = 0;
        
        if (percentage == 0) {
            categoryData.offer = 0;
            await categoryData.save();
        } else {
            // Find products in the category
            const products = await productSchema.find({ category: categoryData.name });
            
            for (const product of products) {
                // Check if the product has an existing offer and delete it
                const existingOffer = await offerSchema.findOne({ product: product._id });
                if (existingOffer) {
                    await offerSchema.deleteOne({ _id: existingOffer._id });
                }
                
                discountAmount = (product.price * percentage) / 100;
                product.offer = Math.round(product.price - discountAmount);
                await product.save();
            }
            
            // Optionally, update the category's offer field as well
            categoryData.offer = discountAmount;
            await categoryData.save();
        }
        
        const newOffer = {
            category: categoryId,
            type: type,
            endDate: expireDate,
            amount: discountAmount
        };
        
        const newOfferSchema = new offerSchema(newOffer);
        const savingOffer = await newOfferSchema.save();
        if (savingOffer) {
            res.json({ success: true });
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};


const deleteOffer = async (req,res) => {
    try {
        const { offerId } = req.body
        const offerData = await offerSchema.findOne({_id:offerId});
        if(offerData.type == 'product'){
            const productData = await productSchema.findOne({_id:offerData.product})   
            productData.offer = 0
            await offerData.deleteOne({product:offerData.product})
            const saving = await productData.save()
            if(saving){
                res.json({success:true})
            } 
        }else if(offerData.type == 'category'){
            const categoryData = await categorySchema.findOne({_id:offerData.category});
            categoryData.offer = 0
            await offerData.deleteOne({category:offerData.category})
            const productData = await productSchema.updateMany({category:categoryData.name}, {offer:0})
            const saving = await categoryData.save()
            if(saving){
                res.json({success:true})
            }
            
        }
    } catch (error) {
        console.log(error)
    }
}





const reffrel = async (req,res) => {
    try {
        const userDetail = await userSchema.findOne({_id:req.session.user_id})
        if(userDetail.refferel){
            const refferelCode = userDetail.refferel
            const exampleUrl = `http://localhost:3000/register`;
            const refferelLink = exampleUrl + '?refferel=' + refferelCode;
            res.json({refferelLink:refferelLink})

        }else{
        const userId = req.session.user_id;
        const exampleUrl = `http://localhost:3000/register`;
        const refferelCode = generateRfferrel(userId);
        const userData = await userSchema.updateOne(
            {_id:userId},
            {$set: { refferel: refferelCode} },
            { upsert: true }
        )
        const refferelLink = exampleUrl + '?refferel=' + refferelCode;


        res.json({refferelLink:refferelLink})
    }

    } catch (error) {
        console.log(error)
    }
}


function generateRfferrel(userId){
    return userId + '_' + Math.random().toString(36).substring(2,8)
}


module.exports = {
    offer,
    offerProduct,
    addProductOffer,
    deleteOffer,
    categoryOffer,
    addCategoryOffer,
    reffrel
    
}
