const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');


const ImageSchema = new Schema({
    url : String, //i need  to set this for saving the image from cloudinary as a url and filename in mongo
    filename : String
})

//to include 'properties' to campground object, in order to be seen by mapbox popup
const opts = {toJSON: {virtuals: true}};

//for making smaller images for delete option in edit
ImageSchema.virtual('thumbnail').get(function () { 
   return this.url.replace('/upload', '/upload/w_200');
})
const CampgroundSchema = new Schema({
    title : String,
    images : [ImageSchema],
    geometry : {  //we need to follow geoJSON pattern
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price : Number,
    description : String,
    location: String,
    author: {
            type: Schema.Types.ObjectId,
            ref: 'User'
    },
    reviews: [
        {
            type:Schema.Types.ObjectId,
            ref:'Review'
        }
    ]
}, opts);//to include 'properties' to campground object, in order to be seen by mapbox popup

//for making 'properties' in campground object in order to acces popup
CampgroundSchema.virtual('properties.popUpMarkup').get(function () { 
    return `
    <strong><a href="/campgrounds/${this._id}"> ${this.title}</a></strong> 
    <p>${this.description.substring(0, 30)}...</p>`;
 })
 
CampgroundSchema.post('findOneAndDelete', async function(doc) {
    if(doc){
        await Review.deleteMany({
            _id:{
                $in:doc.reviews
            }
        })
    }
})
 
module.exports = mongoose.model('Campground', CampgroundSchema);
