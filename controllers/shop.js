const Order = require('../models/order');
const Product = require('../models/product');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SK);
const PDFDocument = require('pdfkit');

const ITEM_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find().countDocuments().then(numProducts => {
    totalItems = numProducts;
    return Product.find().skip((page-1) * ITEM_PER_PAGE).limit(ITEM_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All products',
        path: '/products',
        isAuthencatied: req.session.isLogin,
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE*page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthencatied: req.session.isLogin
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find().countDocuments().then(numProducts => {
    totalItems = numProducts;
    return Product.find().skip((page-1) * ITEM_PER_PAGE).limit(ITEM_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        isAuthencatied: req.session.isLogin,
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE*page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
    .then(user => {
      // console.log(user.cart.items)
      const products = user.cart.items
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthencatied: req.session.isLogin
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      // console.log(req.user.cart.items)
      // console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(result => {
      return res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user.populate('cart.items.productId')
  .then(user => {
    products = user.cart.items;
    total = 0;
    products.forEach(p => {
      return total += p.quantity * p.productId.price;
    })

    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Thêm mode: 'payment'
      line_items: products.map(p => {
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: p.productId.title,
              description: p.productId.description,
            },
            unit_amount: p.productId.price * 100, // Giá tính bằng cents
          },
          quantity: p.quantity,
        };
      }),
      success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
    });
  })
  .then(session => {
    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'Checkout',
      isAuthencatied: req.session.isLogin,
      products: products,
      totalSum: total,
      sessionId: session.id,
      stripePublicKey: process.env.STRIPE_PK // Truyền public key vào view
    });
  })
  .catch(err => console.log(err));
}

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      // console.log(user.cart.items)
      const products = user.cart.items.map(p => {
        return {quantity: p.quantity, product: {...p.productId._doc}}
      })
      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user._id
        }
      })
      return order.save()
    })
    .then(result => {
      req.user.clearCart();
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      // console.log(user.cart.items)
      const products = user.cart.items.map(p => {
        return {quantity: p.quantity, product: {...p.productId._doc}}
      })
      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user._id
        }
      })
      return order.save()
    })
    .then(result => {
      req.user.clearCart();
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id})
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthencatied: req.session.isLogin
      });
    })
    .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order => {
    if(!order){
      return next(new Error('No order found.'));
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized!'));
    }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    });
    pdfDoc.text('------------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x $' + prod.product.price);
    })
    pdfDoc.text('------------------------');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
    pdfDoc.end();
  }).catch(err => {next(err)});
}