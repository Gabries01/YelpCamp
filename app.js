//if we running in development mood, we can acces secret from .env
if(process.env.NODE_ENV !== "production") { 
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressErrors');
const methodOverride = require('method-override');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const MongoDBStore = require('connect-mongodb-session')(session);
const dbUrl = 'mongodb://localhost:27017/yelp-camp'|| process.env.DB_URL;

mongoose.connect(dbUrl,{
    useNewUrlParser : true,
    useUnifiedTopology: true,
});

//prevent malicious users send an object containing a $ operator, or including a ., which could change the context of a database operation
const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');
const MongoStore = require('connect-mongo');

const db = mongoose.connection;
db.on("error",console.error.bind(console, "conection error:"));
db.once("open" , () => {
    console.log("Datebase Connected");
})
 
const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'))


//to parse body(and this is how we expect our code to look like)
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));
app.use(mongoSanitize({
    replaceWith: '_',
  }),
); //To remove data($, .) using these defaults and replacing

const secret = process.env.SECRET || "bigsecret"
const store =  new MongoDBStore({
    url: dbUrl, 
    collection:"sessions",
    secret,
    touchAfter: 24 * 60 * 60
})

store.on("error", function(e) {
    console.log("Session Store Error", e)
})

const sessionConfig = {
    store,
    name:'session',//instead of default name:connect.sid(which can be haked)
    secret,
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,//our cookies are been accesed only with http, not js
       // secure: true,//(https)
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
}
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet({contentSecurityPolicy: false}));
app.use(helmet.crossOriginEmbedderPolicy({ policy: "credentialless" }));

/*const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/drgdx8slx/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);
*/
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

//how to store/unstore in the session
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    //hiding in navbar if there is a user logged or not
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
    res.render('home')
});

app.use((err, req, res, next) => {
    const { statusCode = 500} = err;
    if(!err.message) err.message ="Oh No, Something Went Wrong!" 
    res.status(statusCode).render('error',{err})
    console.log(err)
})

app.all('*', (req, res, next) => {
    next(new ExpressError("Page not found", 404))
    
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}!`)
})