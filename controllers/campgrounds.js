const Campground = require('../models/campground');
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN; //we take the key from .env for geocoding
const geocoder = mbxGeocoding({accessToken: mapBoxToken});// contain the  methodes

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds})
};

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
};

module.exports.createCamp = async (req, res, next) => {
        const geoData = await geocoder.forwardGeocode({
            query: req.body.campgrounds.location,
            limit: 1
        }).send()
        const campground = new Campground(req.body.campgrounds);
        campground.geometry = geoData.body.features[0].geometry;//add geometry
        campground.images = req.files.map(f => ({url: f.path, filename: f.filename}));//it makes an array of objects in order to be saved in mongo
        campground.author = req.user._id;//associated with author
        await campground.save();
        console.log(campground);
        req.flash('success', 'Successfully made a new campground!')
        res.redirect(`/campgrounds/${campground._id}`)
};

module.exports.showCamp = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if(!campground){
        req.flash('error', 'Cannot find campground!');
        return res.redirect('/campgrounds');
    }
    res.render ('campgrounds/show', {campground})
};

module.exports.renderEditForm = async(req, res) => {
    const {id} = req.params;
    const campground = await Campground.findById(id);
    if(!campground){
        req.flash('error', 'Cannot find campground!');
        return res.redirect('/campgrounds');
    }
    res.render ('campgrounds/edit', {campground});
};

module.exports.updateCamp = async (req, res) => {
    const {id} = req.params;
    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id,{...req.body.campgrounds});
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));//loop over and make an array
    campground.images.push(...imgs); //pushing over existing images
    await campground.save();
    if(req.body.deleteImages) {
        for(let filename of req.body.deleteImages) {
           await cloudinary.uploader.destroy(filename);//delete from cloudinary
        }
       await campground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}})//delete from mongo
       console.log(campground)
    }
    req.flash('success', 'Successfully edited the campground!')
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCamp = async (req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted  campground!')
    res.redirect('/campgrounds');

};
