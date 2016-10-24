var Strategy=require('passport-github').Strategy;
var mongo=require('mongodb');

require('dotenv').load();

var muri=process.env.MONGO_URI;

module.exports=function (passport){

    passport.serializeUser(function(user, done){
        done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done){
        mongo.connect(muri, function(err, db ){
            if(err)
                done(err);
            else{
                db.collection('users').find({id: id},{_id: false, id: true, name: true, username: true, email: true}).toArray(function(err, ar){
                    done(err, ar[0]);
                });
            }
        });
    });

    passport.use(new Strategy({
             clientID: process.env.GITHUB_CLIENT_ID,
             clientSecret: process.env.GITHUB_CLIENT_SECRET,
             callbackURL: process.env.CALLBACK_URL
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
                                db.collection('users').insert({id: profile.id, username: profile.username, name: profile.displayName, /*email: profile.emails[0],*/ polls: []}, function(err, results){
                                    return done(err, results.ops[0]);
                                });
                            }
                        });
                    }
              });
         //return done(null, profile);
            });
         }));
}
