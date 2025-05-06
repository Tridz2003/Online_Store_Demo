const Product = require('../models/product');
const fileHelper = require('../helpers/file');
const { file } = require('pdfkit');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    errorMessage: null,
    editing: false,
    isAuthencatied: req.session.isLogin
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if(!imageUrl) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      errorMessage: 'Attached file is not an image',
      editing: false,
      isAuthencatied: req.session.isLogin
    })
  }
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl.path,
    userId: req.user._id
  });
  product.save()
    .then(result => {
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        errorMessage: null,
        product: product,
        isAuthencatied: req.session.isLogin
      });
    })
    .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.file;
  const updatedDesc = req.body.description;
  if(!updatedImageUrl){
    return res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      errorMessage: 'Attached file is not an image',
      editing: editMode,
      product: product,
      isAuthencatied: req.session.isLogin
    });
  }
  Product.findById(prodId)
  .then(product => {
    if(product.userId.toString() !== req.user._id.toString()){
      req.flash('error', 'You are not authorized to edit this product')
      return res.redirect('/login')
    }
    product.title = updatedTitle;
    product.price = updatedPrice;
    fileHelper.deleteFile(product.imageUrl); // Xoa arnh cu
    product.imageUrl = updatedImageUrl.path;
    product.description = updatedDesc;
    return product.save()
  })
  .then(result => {
    if(result) {
      console.log('UPDATED PRODUCT!');
      return res.redirect('/admin/products');}
  })
  .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
    .then(products => {
      // console.log(products)
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthencatied: req.session.isLogin
      });
    })
    .catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      if(!product) {
        return next(new Error('Product not found'));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id: prodId, userId: req.user._id})
    })
    .then(result => {
      if(result.deletedCount === 0) {
        req.flash('error', 'You are not authorized to delete this product');
        return res.redirect('/login');
      }
      console.log('DESTROYED PRODUCT');
      return res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/admin/products');
    })
};
