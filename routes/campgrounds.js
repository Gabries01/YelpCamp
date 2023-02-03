const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Campground = require('../models/campground');
const campgrounds = require('../controllers/campgrounds');
const passport  = require('passport');
const {isLoggedIn, isAuthor, validateCampground} = require('../middleware');
const campground = require('../models/campground');

const multer  = require('multer');// for uploading images
const {storage} = require('../cloudinary');
const upload = multer({ storage});//save the files in storage 

router.route('/')
  .get( catchAsync(campgrounds.index))
  .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCamp))

router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
  .get(catchAsync(campgrounds.showCamp))
  .put(isLoggedIn ,isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCamp))
  .delete(isLoggedIn ,isAuthor, catchAsync(campgrounds.deleteCamp));

router.get('/:id/edit',isLoggedIn ,isAuthor ,catchAsync(campgrounds.renderEditForm));

module.exports = router;

