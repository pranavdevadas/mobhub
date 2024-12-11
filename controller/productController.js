const Products  = require('../model/products')
const Brand = require('../model/brand')
const Category = require('../model/catogory')

const multer = require('multer')

const storage = multer.diskStorage({
    destination:'public/product_images',
    filename:(req,file,cb)=>{
        const uniqueSuffex = Date.now() + '-' + Math.round ( Math.random() * 1e9)
        cb(null,uniqueSuffex + '-' + file.originalname)
    }
})

const fileFilter = (req,res,cb)=>{
    cb(null,true)
}

const upload = multer({
    storage:storage,
    fileFilter:fileFilter
})

const productController ={

//get products
    getproducts:async(req,res,next)=>{
        try{

            const currentPage = parseInt(req.query.page) || 1; 
            const limit = 7; 
            const skip = (currentPage - 1) * limit;

            const totalItems = await Products.countDocuments()
            const totalPages = Math.ceil(totalItems / limit);
            const products = await Products.find().skip(skip).limit(limit).populate('category').populate('brand').sort({ created : -1 })
            res.render('admin/products',{
                title :'Product Lists',
                products : products,
                totalPages,
                currentPage
            })
        }
        catch(err){
            next(err)
        }
    },

//get add products
    getaddproducts:async(req,res,next)=>{
        try{
            const category = await Category.find()
            const brand = await Brand.find()
            res.render('admin/addProduct',{
                title:'Add Products',
                category:category,
                brand:brand
            })
        }
        catch(err){
            next(err)
        }
    },
//post add product
    postaddproduct:(req,res,next)=>{
        try{
            upload.array('images')(req,res,async(err)=>{
                if(err){
                    return res.json({message:err.message, type:'danger'})
                }
                const images = req.files.map((file)=>`/product_images/${file.filename}`)

                const product = new Products({
                    productname:req.body.productname,
                    description:req.body.description,
                    category:req.body.category,
                    brand:req.body.brand,
                    stock:req.body.stock,
                    colour:req.body.colour,
                    oldprice:req.body.oldprice,
                    newprice:req.body.newprice,
                    ram:req.body.ram,
                    storage:req.body.storage,
                    images:images
                })

                await product.save()
                res.redirect('/admin/product')
            })
        }
        catch(err){
            next(err)
        }
    },
//publish and unpublish product
    unpublishProduct:async (req,res,next)=>{
        try{
            const Id = req.params.Id
            await Products.findByIdAndUpdate(Id, { ispublished: false })
            res.redirect('/admin/product')
        }
        catch(err){
            next(err)
        }
    },
    publishProduct:async (req,res,next)=>{
        try{
            const Id = req.params.Id
            await Products.findByIdAndUpdate(Id, { ispublished: true })
            res.redirect('/admin/product')
        }
        catch(err){
            next(err)
        }
    },
//get edit products
    geteditProducts:async(req,res,next)=>{
        try{
            
            const Id = req.params.Id
            
            const product = await Products.findById(Id)
            console.log(product);
            if(!product){
                redirect('/admin/product')
            }
            else{
                const allCategory = await Category.find()
                const allBrand = await Brand.find()
                res.render('admin/editProduct',{
                    title:'Edit Product',
                    product:product,
                    category:allCategory,
                    brand:allBrand
                })
            }
        }
        catch(err){
            next(err)
        }
    },
//post edit product
    posteditProduct:async(req,res,next)=>{
        try{
            upload.array('images')(req,res,async(err)=>{
                if(err){
                    return res.json({message:err.message, type:'danger'})
                }

                const images = req.files.map((file)=>`/product_images/${file.filename}`)
                const Id = req.params.Id

                   const result =  await Products.findByIdAndUpdate(Id,{
                        productname:req.body.productname,
                        description:req.body.description,
                        category:req.body.category,
                        brand:req.body.brand,
                        stock:req.body.stock,
                        colour:req.body.colour,
                        oldprice:req.body.oldprice,
                        newprice:req.body.newprice,
                        ram:req.body.ram,
                        storage:req.body.storage,
                        images:images
                    })
                        console.log(result);
                        res.redirect('/admin/product')
                    })
                }
            
        
        catch(err){
            next(err)
        }
    },









}


module.exports = productController