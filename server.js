var express=require('express');
var passport=require('passport');
var Strategy=require('passport-github').Strategy;
var mongo=require('mongodb');
var session=require('express-session');

var muri='mongodb://localhost:27017/localUsers';

var GITHUB_CLIENT_ID = "d6cfe92b7dfed98e35e7";//<Your ClientID here>";
var GITHUB_CLIENT_SECRET = "d405011ead2a9b0a2783159854c7744184bc9a57";//<Your ClientSecret here>";

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    mongo.connect(muri, function(err, db){
        if(err)
            done(err);
        else{
            db.collection('users').find({id: id}, {_id: false}).toArray(function(er, ar){
                done(er, ar[0]);
            });
        }
    });
    //done(null, id)
});

passport.use(new Strategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: 'http://127.0.0.1:3000/auth/github/callback/'
},
function(accessToken, refreshToken, profile, done){
    process.nextTick(function(){
        mongo.connect(muri, function(err, db){
            if(err)
                return done(err);
            else{
                db.collection('users').find({id: profile.id}).toArray(function(er, ar){
                    if(er)
                        return done(er);
                    if(ar.length>0)
                        return done(null, ar[0]);
                    else{
                        db.collection('users').insert({id: profile.id, username: profile.username, name: profile.displayName, email: profile.emails[0].value}, function(err, results){
                            return done(err, results.ops[0]);
                        });
                    }
                });
            }
        });
        //return done(null, profile);
    });
}));

var app=express();

app.use(session({secret: 'penPineappleApplePen', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', isauth, function(req, res){
    res.send('Hello, '+req.user.name+'!!!');
});

app.get('/account', isauth, function(req, res){
    res.send(JSON.stringify(req.user));
});

app.get('/login', function(req, res){
    res.send('<html><body><a href="/auth/github">Login with github</a></body></html>');
});

app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback',
    passport.authenticate('github', {failureRedirect: '/login'}),
    function(req, res){ res.redirect('/');});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

var port=process.env.PORT || 3000;

app.listen(port, function(){
    console.log('The server is running on port '+port+'...');
});

function isauth(req, res, next){
    if(req.isAuthenticated())
        next();
    else
        res.redirect('/login');
}
