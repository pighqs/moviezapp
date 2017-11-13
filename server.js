//////// PACKAGES
var express = require('express');
// on stocke l'app express dans une variable app : initialisation
var app = express();
// permet de charger des fichiers statiques (css, images, fichiers js externes), ils doivent etre placés dans le dossier "public"
app.use(express.static('public'));

app.set('view engine', 'ejs');
// Request is designed to make http calls. It supports HTTPS and follows redirects by default.

var bodyParser = require('body-parser');
// bodyParser permet de gerer les requetes HTTP POST : extrait le corps entier de la requete et le met dans req.body
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// MailChimp
var Mailchimp = require('mailchimp-api-v3');

// Trello
var Trello = require("trello");

// ApiKEYS
var myKEYS = require('./hide_Content/ApiKEYS');

var request = require('request');

// module stripe pour les paiements
var stripe = require("stripe")("sk_test_IoTOHpFg6GZ05nSAPpzkhYMp");

// SESSION
var session = require("express-session");
app.use(
    session({
        secret: 'a4f8071f-c873-4447-8ee2',
        resave: false,
        saveUninitialized: false,
    })
);

// Moviez
var sort = "vote_count.desc";
var lang = "fr-FR";
var movies = [];

// passerelle connection DB : Mongoose
var mongoose = require('mongoose');
// pour empêcher erreur si base de donnees met trop longtemps a repondre
var options = { server: { socketOptions: { connectTimeoutMS: 30000 } } };
// connection base de données
mongoose.connect('mongodb://moviez:moviez@ds249005.mlab.com:49005/moviez', options, function(err) {
    if (err) {
        console.log("erreur : " + err);
    } else {
        console.log("connection moviez DB OK");
    }
});

// schemas
var movieSchema = mongoose.Schema({
    movieID: Number,
    title: String,
    posterpath: String,
    overview: String,
    likeByUser: String
});

var userSchema = mongoose.Schema({
    userEmail: String,
    userPassword: String
});

// models
var MovieModel = mongoose.model('movies', movieSchema);
var UserModel = mongoose.model('users', userSchema);

////////////////////////////////////////
//////////////// ROUTES ////////////////
////////////////////////////////////////

//////////////// Home ////////////////
app.get('/', function(req, res) {

    console.log("logged ? " + req.session.islogged);


    var moviesDiscoverURL = "https://api.themoviedb.org/3/discover/movie?api_key=" + myKEYS.themoviedbAPIKey + "&language=" + lang + "&sort_by=" + sort + "&include_adult=true&include_video=false&page=1";

    request(moviesDiscoverURL, function(error, response, body) {

        // la requête nous renvoie les infos qui seront stockées au format JSON dans une variable "body":
        movies = JSON.parse(body);

        // on appelle la collection movies (films enregistrés dans db), mais uniquement ceux qui ont même id que user
        var query = MovieModel.find({ likeByUser: req.session.userID });
        query.exec(function(error, datas) {
            res.render('home', { movies, likedmovies: datas, page: "home", isUserLog: req.session.islogged });
        });

    });
});

//////////////// Like ////////////////
app.get('/like', function(req, res) {
    if (req.session.islogged === true) {
        if (req.query.movieID && req.query.movieID != "") {
            var movieID = req.query.movieID;

            //la ville demandée en url via le formulaire à openweathermap est stockée dans une variable
            var movieURL = "https://api.themoviedb.org/3/movie/" + movieID + "?api_key=" + myKEYS.themoviedbAPIKey + "&language=" + lang;

            request(movieURL, function(error, response, body) {
                // seulement si la réponse n'est pas 404 ()
                if (response.statusCode !== 404) {

                    // la requête nous renvoie les infos qui seront stockées au format JSON dans une variable "body":
                    body = JSON.parse(body);

                    // on récupère les infos de body pour assigner une nouvelle variable newCity
                    var newMovie = new MovieModel({
                        movieID: body.id,
                        title: body.original_title,
                        posterpath: body.poster_path,
                        overview: body.overview,
                        likeByUser: req.session.userID
                    });


                    // on insere dans la base de donnees
                    newMovie.save(function(error, movie) {});
                    //on redirige sur la home
                    res.redirect("/");

                } else {
                    console.log('statusCode:', response && response.statusCode);
                }

            });

        }

    } else if (!req.session.islogged) {
        res.redirect("/signup");
    }
});

//////////////// Unlike ////////////////
app.get('/unlike', function(req, res) {
    // recupere ID unique envoyé en requête et supprime entrée correspondante dans la base de données
    MovieModel.remove({ movieID: req.query.movieID, likeByUser: req.session.userID }, function(error, ville) {
        //on redirige sur la home
        res.redirect("/");
    });
});

//////////////// Review ////////////////
app.get('/review', function(req, res) {
    if (req.session.islogged === true) {
        var query = MovieModel.find({ likeByUser: req.session.userID });
        query.exec(function(error, datas) {
            res.render('review', { movies: datas, page: "review", isUserLog: req.session.islogged });
        });
    } else {
        res.redirect("/signin");
    }
});

//////////////// Single ////////////////
app.get('/single', function(req, res) {
    var movieID = req.query.movieID;

    //la ville demandée en url via le formulaire à openweathermap est stockée dans une variable
    var movieURL = "https://api.themoviedb.org/3/movie/" + movieID + "?api_key=" + myKEYS.themoviedbAPIKey + "&language=" + lang;
    var creditsURL = "https://api.themoviedb.org/3/movie/" + movieID + "/credits?api_key=" + myKEYS.themoviedbAPIKey;

    request(movieURL, function(error, response, body) {
        body = JSON.parse(body);
        request(creditsURL, function(error, response, credits) {
            credits = JSON.parse(credits);
            res.render('single', { body, credits, page: "single", isUserLog: req.session.islogged });

        });
    });
});

//////////////// Search ////////////////
app.get('/search', function(req, res) {
    var recherche = req.query.movieSearch;
    var searchURL = "https://api.themoviedb.org/3/search/movie?api_key=" + myKEYS.themoviedbAPIKey + "&query=" + recherche;

    request(searchURL, function(error, response, searchResults) {
        movies = JSON.parse(searchResults);

        MovieModel.find(function(err, likedmovies) {
            res.render('home', { movies, likedmovies, page: "search", isUserLog: req.session.islogged });
        });
    });
});

//////////////// SignUP ////////////////
app.get('/signup', function(req, res) {
    res.render('signup', { page: "sign", isUserLog: undefined, alert: undefined });
});

app.post('/signup', function(req, res) {

    var query = UserModel.findOne({ userEmail: req.body.email });
    query.exec(function(error, user) {
        if (!user) {
            // on récupère les infos de body pour assigner une nouvelle variable newCity
            var newUser = new UserModel({
                userEmail: req.body.email,
                userPassword: req.body.password
            });

            // on insere dans la base de donnees
            newUser.save(function(error, user) {
                // on enregistre l'id déterminé par la DB en id de session
                req.session.userID = user._id;
                req.session.islogged = true;
                //on redirige sur la home
                res.redirect("/");
            });

        } else {
            console.log("user already exist");
            res.render('signup', { page: "sign", isUserLog: undefined, alert: "user already exist" });
        }

    });
});

//////////////// SignIN ////////////////
app.get('/signin', function(req, res) {
    res.render('signin', { page: "sign", isUserLog: undefined, alert: undefined });
});

app.post('/signin', function(req, res) {

    var query = UserModel.findOne({ userEmail: req.body.email });
    query.exec(function(error, user) {
        if (!user) {
            console.log("user mail doesn't exist");
            res.render('signin', { page: "sign", isUserLog: undefined, alert: "user unknown" });
        } else {
            if (user.userPassword === req.body.password) {
                console.log("user and password OK");
                req.session.islogged = true;
                req.session.userID = user._id;
                res.redirect("/");
            } else {
                console.log("wrong password");
                res.render('signin', { page: "sign", isUserLog: undefined, alert: "wrong password" });
            }
        }

    });
});

//////////////// SignOUT ////////////////
app.get('/signout', function(req, res) {
    req.session.islogged = false;
    res.redirect("/");
});

//////////////// Contact ////////////////
app.get('/contact', function(req, res) {
    res.render('contact', { page: "contact", isUserLog: req.session.islogged, alert: undefined });
});

app.post('/contact', function(req, res) {
    var trello = new Trello(myKEYS.trelloAPIKey, "86c2e81ae99d6740405e9b33e67d49734efbbbe0ec031236b512de6ea0c086f0");
    var trelloCardNewContact = "5a09a7e422c2f1bda121471c";
    var trelloCardNotInterested = "5a09a7eafcacac01f997ba2a";
    var trelloCardLater = "5a09a7ee3f679fd47bb18978";
    var trelloCardClients = "5a09a7f7ea8af85f9b2f99bd";

    var mailchimp = new Mailchimp(myKEYS.mailChimpAPIKey);
    var myList = "6414d49f08";
    // récupère infos du formulaire de contact et créée nouveau membre dans la liste mailchimp entrée en paramètre :
    mailchimp.post('/lists/' + myList + '/members', {
            email_address: req.body.email,
            status: 'subscribed',
            merge_fields: {
                "FNAME": req.body.firstName,
                "LNAME": req.body.lastName,
                "MESS": req.body.msgContent
            }
        })
        .then(function(results) {
            var query = UserModel.findOne({ userEmail: req.body.email });
            query.exec(function(error, user) {
                if (!user) {
                    // on récupère les infos de body pour assigner une nouvelle variable newCity
                    var newUser = new UserModel({
                        userEmail: req.body.email,
                    });


                    // on insere dans la base de donnees
                    newUser.save(function(error, user) {
                        console.log("contact saved in DB");
                    });
                    // on ajoute carte dans liste Nouveau Contact dans tableau Trello Moviez
                    trello.addCard(req.body.email, req.body.msgContent, trelloCardNewContact,
                        function(error, trelloCard) {
                            if (error) {
                                console.log("Could not add card:" + error);
                            } else {
                                console.log("card added");
                            }
                        });


                } else {
                    console.log("user not save in DB : already exists");
                }
            });
            res.redirect("/");

        })

        .catch(function(err) {
            //console.log(err.title);
            res.render('contact', { page: "contact", isUserLog: req.session.islogged, alert: err.title });
        });
});



//////////////// Pay ////////////////
app.post('/pay', function(req, res) {
    //montant (en centimes)
    var amount = 500;

    // stripe créé une liste de clients
    stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken
        }) // une fois que la liste de clients est créée, on créé la transactio,
        .then(customer =>
            stripe.charges.create({
                amount,
                description: req.body.titleMovie,
                currency: "eur",
                customer: customer.id
            })) // une fois la transaction créée, on fait un render de la page
        .then(charge => res.send('PAYMENT OK'));
});

//////// LISTEN
// process.env.PORT est le port attribué par hénergeur
var port = (process.env.PORT || 8080);
app.listen(port, function() {
    console.log("server listening on port: " + port);
});