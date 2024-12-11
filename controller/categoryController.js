const User = require('../model/users')
const Category = require('../model/catogory')

const categoryController ={

//get category
    getcategory :async (req,res,next)=>{
        try{
            const categories = await Category.find()
            res.render('admin/category',{
                title:'Add Category',
                categories: categories
            })
        }
        catch(err){
            next(err)
        }
    },
//publish and unpublish category
    unpublishcategory:async (req,res,next)=>{
        try{
            const Id = req.params.Id
            await Category.findByIdAndUpdate(Id, { isListed: false })
            res.redirect('/admin/category')
        }
        catch(err){
            next(err)
        }
    },
    publishcategory:async (req,res,next)=>{
        try{
            const Id = req.params.Id
            await Category.findByIdAndUpdate(Id, { isListed: true })
            res.redirect('/admin/category',200,{
                title:'Edit Category',

            })
        }
        catch(err){
            next(err)
        }
    },
//get add category
    getaddcategory: async (req,res,next)=>{
        try{
            res.render('admin/addCategory')
        }
        catch(err){
            next(err)
        }
    },
//post add category
    postaddcategory:async (req,res,next)=>{
        try{
            const existingcategory = await Category.findOne({category:req.body.category})
            if(existingcategory){
                res.render('admin/addCategory',{
                    title:'Add Category',
                    alert: 'Category is alredy exist, try with other category'
                })
            }
            else{
                const category = new Category({
                    category: req.body.category,
                    description: req.body.description
                })
                await category.save()
                res.redirect('/admin/category')
            }
        }
        catch(err){
            next(err)
        }
    },
//edit category
    getEditcategory: async(req,res,next)=>{
        try{
            const Id = req.params.Id
            const category = await Category.findById(Id)
            res.render('admin/editCategory',{
                data:category
            })
        }
        catch(err){
            next(err)
        }
    },
//post edit category
    postEditcategory: async(req,res,next)=>{
        try{

            const existingcategory = await Category.findOne({category:req.body.category})

            if(existingcategory){
                res.render('admin/editCategory',{
                    alert: 'Category is alredy exist, try with other category',
                    title: 'Edit Category',
                    data: req.body
                })
            }
            else{
                const Id = req.params.Id
                await Category.findByIdAndUpdate(Id, {
                category: req.body.category,
                description: req.body.description
            })
            }
            res.redirect('/admin/category')
        }
        catch(err){
            next(err)
        }
    },



}

module.exports= categoryController