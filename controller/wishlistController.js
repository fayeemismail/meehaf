const userSchema = require('../models/userModel')
const productSchema = require('../models/productModel');
const wishlistSchema = require('../models/wishlistSchema');
const cartSchema = require('../models/cartModel');


const wishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const page = parseInt(req.query.page) || 1; // Current page number, default to 1
        const limit = 5; // Number of products per page

        const wishlistData = await wishlistSchema.findOne({ user: userId }).populate('Products.Product');

        if (!wishlistData || !wishlistData.Products || wishlistData.Products.length === 0) {
            res.render('wishlist', { wishlistData: { Products: [] }, currentPage: 1, totalPages: 1 });
        } else {
            const totalProducts = wishlistData.Products.length;
            const totalPages = Math.ceil(totalProducts / limit);

            // Get products for the current page
            const products = wishlistData.Products.slice((page - 1) * limit, page * limit);

            res.render('wishlist', {
                wishlistData: { Products: products },
                currentPage: page,
                totalPages: totalPages
            });
        }
    } catch (error) {
        console.log(error);
    }
};


const checkWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { productId } = req.body;

        if (!userId) {
            return res.status(200).json({ noUser: true });
        }

        const wishlistData = await wishlistSchema.findOne({ user: userId });

        if (wishlistData) {
            const exist = wishlistData.Products.find(item => item.Product.toString() === productId);
            if (exist) {
                return res.status(200).json({ inWishlist: true });
            }
        }

        res.status(200).json({ inWishlist: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { productId } = req.body;

        if (!userId) {
            return res.status(200).json({ noUser: true });
        }

        const wishlistData = await wishlistSchema.findOne({ user: userId });

        if (!wishlistData) {
            const newWishlist = new wishlistSchema({
                user: userId,
                Products: [{ Product: productId }]
            });
            await newWishlist.save();
            return res.status(200).json({ success: true });
        } else {
            const exist = wishlistData.Products.find(item => item.Product.toString() === productId);
            if (exist) {
                return res.status(200).json({ fail: 'The product is already in the wishlist' });
            } else {
                wishlistData.Products.push({ Product: productId });
                await wishlistData.save();
                return res.status(200).json({ success: true });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
};




const removeWishlit = async (req,res) => {
    try {
        const {productId} = req.body;
        const userId = req.session.user_id;

        const remove = await wishlistSchema.updateOne(
            { user:userId },
            { $pull: { Products: { Product: productId } } }
        );

        if(remove.modifiedCount > 0){
            res.json({success:true})
        }else{
            res.json({success:false, message:"the Product not found in the wishlist or not removed"});
        }
    } catch (error) {
        console.log(error)
    }
}



module.exports = {
    wishlist,
    addToWishlist,
    removeWishlit,
    checkWishlist,


}