const category = require('../models/categoryModel');
const { findById } = require('../models/userModel');



const categories = async (req, res) => {
    try {
        const item = await category.find()
               

        res.render('categories', { item })
    } catch (error) {
        console.log(error)
    }
}

const addCategory = async (req,res) => {
    try {
        const { name, description } = req.body
        
        const item = await category.find()
        if(!name || name.trim().length <= 2){
            res.render('categories' , {message: 'name must contain atleast 2 letters' ,item })
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
        res.render('editCategory',{categoryData} )
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