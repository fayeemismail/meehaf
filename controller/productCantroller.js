const products = require('../models/productModel');
const category = require('../models/categoryModel');
const { categories } = require('./categoryController');
const { product } = require('./adminController');
const { finished } = require('nodemailer/lib/xoauth2');

const newProducts = async (req, res) => {

    try {
        const categoryData = await category.find();
        res.render('newProducts', { categories: categoryData })
    } catch (error) {
        console.log(error)
    }

}


const addProducts = async (req, res) => {
    try {
        const { name, description, price, stock, category } = req.body;
        console.log(req.body);

        // Validate name
        if (!name || name.trim().length < 3) {
            return res.render('newProducts', { message: 'The name should contain at least 3 letters' });
        }
        
        // Validate price
        if (!price || price <= 0) {
            return res.render('newProducts', { message: 'The price must be greater than 0' });
        }

        // Validate stock
        if (stock < 0) {
            return res.render('newProducts', { message: 'The stock must be 0 or greater' });
        }
        
        // Check for existing product
        const existingProduct = await products.findOne({ name });
        if (existingProduct) {
            return res.render('newProducts', { message: 'A product with the same name already exists' });
        }

        const imagePath = req.files.map(file => file.filename);
        
        // Create new product
        const newProduct = new products({
            name,
            description,
            price,
            stock,
            image: imagePath,
            category
        });
        console.log(newProduct, 'this is new produc')

        // Save new product
        await newProduct.save();
        res.send({ success: 1 });
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
};





const editProducts = async (req, res) => {

    try {
        const productId = req.query.id;
        const categoryData = await category.find({ status: true })
        

        const item = await products.findById(productId)

        // console.log('this is item '+item+ ' ' + 'this is category ' + categoryData)

        res.render('editProducts', { product: item, categories: categoryData })
    } catch (error) {
        console.log(error)
    }

}

const updateProducts = async (req, res) => {
    try {
        const productData = req.body;
        const imageData = req.files;
        const existImagePaths = req.body.existImagePaths;

        const findItem = await products.findOne({ _id: productData.productId });
        if (!findItem) {
            return res.status(404).send({ success: 0, message: 'Product not found' });
        }
        // Update product details
        findItem.name = productData.name;
        findItem.description = productData.description;
        findItem.price = productData.price;
        findItem.stock = productData.stock;
        findItem.category = productData.category;

        if(req.files && req.files.length > 0 ){
            req.files.forEach(item => {
                if(item.originalname === 'imageInput0'){
                    findItem.image[0] = item.filename
                }else if (item.originalname === 'imageInput1'){
                    findItem.image[1] = item.filename
                }else{
                    findItem.image[2] = item.filename
                }
            });
        }

        // Save product
        const savedProduct = await findItem.save();
        if (savedProduct) {
            res.send({ success: 1 });
            console.log('Successfully edited the product');
        } else {
            res.status(500).send({ success: 0, message: 'Failed to save the product' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({ success: 0, message: 'Internal server error' });
    }
};





const productBlock = async (req, res) => {

    try {
        const productId = req.query.id;
        const productData = await products.findOne({ _id: productId });
        productData.status = !productData.status
        const saving = await productData.save();

        if (saving) {
            res.send({ success: 1 })
            console.log(productId + ' listing or unlisting productId')
        } else {
            res.send({ success: 0 })
        }

    } catch (error) {
        console.log(error);
        res.send({ success: 0 })
    }
}




const sortProduct = async (req,res)=> {
    try {
        const itemData = req.body.itemValue
        if(itemData){
            let productData;
            if(itemData == 'sortAZ'){
                    productData = await products.find().sort({name:1})
            }else if(itemData == 'sortZA'){
                    productData = await products.find().sort({name:-1})
            }else if(itemData == 'PriceLow'){
                productData = await products.find().sort({price:1})
            }else{
                productData = await products.find().sort({price:-1})
            }

            console.log(productData, 'this is productData in line 166')

            res.status(200).json({success: true, productData: productData})

        }
    } catch (error) {
        console.log(error)
    }
}



const checkStock = async (req,res) => {
    try {
        const productId = req.body.productId;
        const product = await products.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ stock: product.stock });        
    } catch (error) {
        console.log(error)
    }
}



module.exports = {
    newProducts,
    addProducts,
    editProducts,
    updateProducts,
    productBlock,
    sortProduct,
    checkStock,
    
}
