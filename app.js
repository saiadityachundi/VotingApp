var express=require('express');
var passport=require('passport');
var Strategy=require('passport-github2').Strategy;
var mongo=require('mongodb');
var session=require('express-session');

var GITHUB_CLIENT_ID = "12c526a4feba3f5c5b7f";
var GITHUB_CLIENT_SECRET = "eeeafa10eede2b48787c394e2bfa0c84c0b49a32";

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(id, done){
   done(null, id);
});

passport.use(new Strategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: 'http://127.0.0.1:3000/auth/github/callback'
},
function(accessToken, refreshToken, profile, done){
    process.nextTick(function(){
       return done(null, profile);
    });
    }
));

var app=express();

app.use(session({secret: 'penPineappleApplePen', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', isauth, function(req, res){
    res.end('Hello,'+req.user.displayName+'!!!');
});

app.get('/account', isauth, function(req, res){
    res.json(req.user);
});

app.get('/login', function(req, res){
    res.end('<html><body><a href="/auth/github">Login with github</a></body></html>');
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
