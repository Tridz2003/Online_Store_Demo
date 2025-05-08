const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session')
const MongoDBSession = require('connect-mongodb-session')(session)
const flash = require('connect-flash')
const multer = require('multer')
require('dotenv').config();

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();
const store = new MongoDBSession({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },  
  filename: (req, file, cb) => {
    const date = new Date().toISOString().replace(/:/g, '-');
    cb(null, req.user._id.toString() + '_' + date + '_' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if(file.minetype === 'image/png' || 
    file.mimetype === 'image/jpg' || 
    file.mimetype === 'image/jpeg') {
      cb(null, true);
  }else{
    cb(null, false);
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store}))
app.use(flash())

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
  .then(user => {
    req.user = user;
    next();
  }).catch(err => {console.log(err)})
})

app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

// app.use((error, req, res, next) => {
//   res.status(500).render('500', {
//     pageTitle: 'Error',
//     path: '/500',
//     isAuthencatied: req.session.isLogin
//   });
// });

mongoose.connect(
    process.env.MONGODB_URI
  )
  .then(result => {
    console.log('Connected Database')
    app.listen(process.env.APP_PORT);
  })
  .catch(err => {
    console.log(err);
  });
