const category = require('../models/categoryModel');
const { findById } = require('../models/userModel');



const categories = async (req, res) => {
    try {
        const perPage = 10; // Number of categories per page
        const page = parseInt(req.query.page) || 1; // Current page, default to 1 if not provided

        const totalCategories = await category.countDocuments(); // Total number of categories
        const totalPages = Math.ceil(totalCategories / perPage); // Calculate total pages

        const item = await category.find()
            .sort({ _id: -1 })
            .skip((page - 1) * perPage) // Skip the first (page-1) * perPage categories
            .limit(perPage); // Limit to `perPage` categories

        res.render('categories', { item, currentPage: page, totalPages, activePage: 'categories' });
    } catch (error) {
        console.log(error);
    }
};


const addCategory = async (req,res) => {
    try {
        const { name, description } = req.body
        
        const item = await category.find()
        if(!name || name.trim().length <= 2){
            res.render('categories' , {message: 'name must contain atleast 2 letters' ,item, activePage: 'categories' })
        }else{

        const newCategory = new category({
            name: name,
            description: description
        })
        const saving = await newCategory.save()
        if(saving){
            console.log('success')
        }
        res.redirect('/admin/categories')
    }
        
    } catch (error) {
        console.log(error)
    }
}





const editCategory = async (req,res) => {
    try {
        const categoryId = req.query.id;
        console.log(categoryId)
        const categoryData = await category.findById(categoryId)
        res.render('editCategory',{categoryData, activePage: 'categories'} )
    } catch (error) {
        console.log(error)
    }
}


const updateCategory = async (req,res) => {

    try {
        const { categoryName, categoryDescription , categoryId } = req.body;
        console.log(req.body);
        const updateData = await category.findOneAndUpdate({_id:categoryId},{name:categoryName,description:categoryDescription});
        if(updateData){
            res.status(200).json({message:'success'})
        }
        

        console.log(req.body.categoryName);
        
        
    } catch (error) {
        console.log(error)
    }

}


const categoryBlock = async (req, res) => {
    try {
        const itemId = req.query.id;
        const itemData = await category.findOne({ _id: itemId });
        itemData.status = !itemData.status;
        const saving = await itemData.save();
        if (saving) {
            res.send({ success: 1 });
            console.log(itemId + ' listing or unlisting data');
        } else {
            res.send({ success: 0 });
        }
    } catch (error) {
        console.log(error);
        res.send({ success: 0 });
    }
};








module.exports = {
    addCategory,
    editCategory,
    categoryBlock,
    categories,
    updateCategory


}