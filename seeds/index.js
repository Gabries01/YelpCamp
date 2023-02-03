
const mongoose = require('mongoose')
const Campground = require('../models/campground');
const cities = require('./cities');
const {descriptors, places} = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp',{
    useNewUrlParser : true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error",console.error.bind(console, "conection error:"));
db.once("open" , () => {
    console.log("Datebase Connected");
})

const sample = array => array[Math.floor(Math.random()* array.length)];

const seedDB = async() => {
    await Campground.deleteMany({});
  
        for( let i = 0; i < 200; i++){
            const random1000 = Math.floor(Math.random() * 1000);
            const price = Math.floor(Math.random() * 30) +10;
            const camp = new Campground({
                author : '639044a5592b5feadc75179f',
                location : `${cities[random1000].city}, ${cities[random1000].state}`,
                title : `${sample(descriptors)} ${sample(places)}`,
                description:'Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit sit quod nihil libero pariatur ducimus nisi id? Cum magnam eaque nesciunt. Atque eveniet assumenda dignissimos expedita iste quidem quod excepturi.',
                geometry: {
                  type: 'Point',
                  coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                  ]
                },
                images : [
                    {
                      url: 'https://res.cloudinary.com/drgdx8slx/image/upload/v1675337343/YelpCamp/zjzlkgt4rnljiiznnfqv.avif',
                      filename: 'YelpCamp/zjzlkgt4rnljiiznnfqv',
                    },
                    {
                      url: 'https://res.cloudinary.com/drgdx8slx/image/upload/v1675337343/YelpCamp/apz7q2rpw8fxdlokcwnw.avif',
                      filename: 'YelpCamp/apz7q2rpw8fxdlokcwnw',
                     
                    }
                  ],
                price
            })
         await camp.save();
        }
};

seedDB().then (() => {
    mongoose.connection.close();

});