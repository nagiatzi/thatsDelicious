const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
      type:  String,
      trim: true,
      required: 'Please enter a store name!'
    },
    slug: String,
    description: {
        type:  String,
        trim: true,
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
      type: {
        type: String,
        default: 'Point'
      },
      coordinates: [{
        type: Number, 
        required: 'You must supply coordinates'
      }],
      address: {
        type: String,
        required: 'You must supply an address!'
      }      
    },
    photo : String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: 'You must supply an author'
    }    
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({ location: '2dsphere'});

storeSchema.pre('save', async function(next) {
   if (!this.isModified('name')) {
       next();
       return;
   } 
    this.slug = slug(this.name);
    //find other slugs an exw wes, tha ginei wes-1, regEx
      // find other stores that have a slug of wes, wes-1, wes-2
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');

    //χρησιμοποιεί constructor γιατί δεν έχει γίνει ακόμα το μοντέλο
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if(storesWithSlug.length) {
       this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});   
//οπότε από εδώ και πέρα το χρησιμοποιώ σαν Store.


//παρακάτω ο τρόπος να κάνουμε δικές μας συναρτήσεις με το static -- mondodb, aggregations pipelines
storeSchema.statics.getTagslist = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group : { _id: '$tags',  count: {$sum: 1} }},
    { $sort: { count: -1 }}
  ]);
};

// find reviews where the stores _id property === reviews store property
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the store?
  foreignField: 'store' // which field on the review?
});


module.exports = mongoose.model('Store', storeSchema);

