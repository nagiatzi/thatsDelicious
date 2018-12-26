const mongoose = require('mongoose');
const Store = mongoose.model('Store');
//multer για upload images
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');



const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: function(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto) {
            next(null, true);
        } else {
            next({message: 'that\'s filetype is not allowed'}, false);
        }
    }
};

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) =>  {
    if(!req.file) {
        next();
        return;
    } 
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;  
    const photo = await jimp.read(req.file.buffer);   
    await photo.resize(800, jimp.AUTO);
    //το κάνει εγγραφή με το περίεργο extension
    await photo.write(`./public/uploads/${req.body.photo}`);
    next();

}

//στην async away δεν χρησιάζεται να έχω nested τα try, catch
exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store =await(new Store(req.body)).save() ;
    req.flash('success', `Successfuly Created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    //παίρνουμε εδώ data από την database
    //εδώ είναι το σημείο που κάνει render τα stores
    const stores = await Store.find();
    res.render('stores', { title: 'Stores', stores });
};

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
      throw Error('You must own a store in order to edit it!');
    }
};

exports.editStore = async (req, res) => {
    //να βρω το store με συγκεκριμένο id
    /* εδώ κάνω χρήση του paramas
        δλδ res.json(req.params);
    */ 
    const store = await Store.findOne({ _id: req.params.id});
    confirmOwner(store, req.user);
    res.render('editStore', {title: `Edit ${store.name}`, store: store});
    console.log('ok');
};


exports.updateStore = async (req, res) => {
    //set the location data to be a point
    //einai h defult τιμή στο schema.
    req.body.location.type = 'Point';
    const store =await Store.findOneAndUpdate({ _id: req.params.id}, req.body, {
       new: true, //επιστρέφει το νέο store
       runValidators: true
    }).exec(); //mongo db μέθοδος q, data, options
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store →</a>`);
    res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug }).populate('author');
    if (!store) return next();
    res.render('store', { store, title: store.name });
  };

//φτιάχνει μια συνάρτηση για να κάνει aggregate queries στη βάση

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true }; 
    const tagsPromise =  Store.getTagslist();
    const storesPromise = Store.find({ tags: tagQuery });
    const [tags, stores] = await Promise.all([tagsPromise,
         storesPromise]);
    res.render('tags',  { tags, title: 'Tags ', tag, stores });  
   //res.json(result); έτσι βλέπω την εφαρμογή
   //var tags = result[0];
   //var stores = result[1]; κάνει destructuring
};

exports.searchStores = async (req, res) => {
    const stores = await Store
    // first find stores that match
    .find({
      $text: {
        $search: req.query.q
      }
    }, {
      score: { $meta: 'textScore' }
    })
    // the sort them
    .sort({
      score: { $meta: 'textScore' }
    })
    // limit to only 5 results
    .limit(5);
    res.json(stores);
    console.log(res.json(stores))
  };

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: 10000 // 10km
        }
      }
    };
  
    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);
  };

exports.mapPage = (req, res) => {
    res.render('map', {title: 'Map'});
}
