var express=require('express');
var passport=require('passport');
var mongo=require('mongodb');
var session=require('express-session');
var routes=require('./app/routes/index.js');
var bodyParser=require('body-parser');

require('./app/config/passport.js')(passport);
require('dotenv').load();

var app=express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: 'penPineappleApplePen', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

app.set('views', __dirname+'/public/views');
app.set('view engine', 'pug');

routes(app, passport);

var port=process.env.PORT || 3000;

app.listen(port, function(){
    console.log('The server is running on port '+port+'...');
});
