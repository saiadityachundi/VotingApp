var mongo=require('mongodb');
var muri='mongodb://localhost:27017/localUsers';

module.exports=function(app, passport){

    app.get('/account', isauth, function(req, res){
        res.send(JSON.stringify(req.user, null, 2));
    });
    
    app.get('/login', function(req, res){
        res.render('login');
    });
    
    app.get('/auth/github', passport.authenticate('github'));
    app.get('/auth/github/callback',
        passport.authenticate('github', {failureRedirect: '/login'}),
        function(req, res){ res.redirect('/');});
    
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.get('/', isauth, function(req, res){
        mongo.connect(muri, function(err, db){
            if(err)
                throw err;
            else{
                var polls;
                db.collection('users').find({id: req.user.id}).toArray(function(err, arr){
                    if(err)
                        throw err;
                    else{
                        var polls=[];
                        var ctr=0;
                        if(arr[0].polls.length){
                            arr[0].polls.forEach(function(val ){
                                db.collection('polls').find({_id: val}, {op: false}).toArray(function(err, docs){
                                    if(err)
                                        throw err;
                                    polls.push(docs[0]);
                                    ctr++;
                                    if(ctr==arr[0].polls.length){
                                        res.render('dash', {name: arr[0].name, polls: polls});
                                    }
                                });
                            });
                        }
                        else{
                            res.render('nopoll', {name: req.user.name});
                        }
                    }
                });
            }
        });
    });

    app.get('/removePoll/:id', isauth, function(req, res){
        var id = req.params.id;
        mongo.connect(muri, function(err, db){
            if(err)
                throw err;
            else{
                db.collection('users').find({polls: mongo.ObjectId(id)}, {_id: false, id: true}).toArray(function(err, arr){
                    if(err)
                        throw err;
                    else{
                        if(arr.length==0)
                            res.send('<html><body><h4>poll deleted...  <a href="/">Go</a> to home page.</h4><body></html>');
                        else{
                            db.collection('users').update({id: arr[0].id}, {$pull: {polls: mongo.ObjectId(id)}});
                            db.collection('polls').remove({_id: mongo.ObjectId(id)});
                            res.send('<html><body><h4>poll deleted...  <a href="/">Go</a> to home page.</h4><body></html>');
                        }
                    }
                });
            }
        });
    });

    app.get('/poll/:id', isauth, function(req, res){
        mongo.connect(muri, function(err, db){
            if(err)
                throw err;
            else{
                db.collection('polls').find({_id: mongo.ObjectId(req.params.id)}, {_id: false}).toArray(function(er, ar){
                    if(er)
                        throw er;
                    else{
                        if(ar.length>0)
                            res.render('polla',{polls: ar, id: req.params.id});
                    }
                });
            }
        });
    });

    app.get('/poll/:id', isauth, function(req, res){
        mongo.connect(muri, function(err, db){
            if(err)
                throw err;
            else{
                db.collection('polls').find({_id: mongo.ObjectId(req.params.id)}, {_id: false}).toArray(function(er, ar){
                    if(er)
                        throw er;
                    else{
                        if(ar.length>0)
                            res.render('polla',{polls: ar, id: req.params.id});
                    }
                });
            }
        });
    });

    app.get('/vote/:id/:st', function(req, res){
        mongo.connect(muri, function(err, db){
            if(err)
                throw err;
            else{
                db.collection('polls').update({_id: mongo.ObjectId(req.params.id), op: {$elemMatch: {st: req.params.st}}}, {$inc: {"op.$.vot" : 1}});
                res.redirect('/poll/'+req.params.id);
            }
        });
    });

    app.get('/pug', function(req, res){
        res.render('pug', {obj: {name: 'ippo'}});
    });

    app.get('/addPoll', isauth, function(req, res){
        res.render('addPoll');
    });

    app.post('/addPoll', isauth, function(req, res){
        var op=req.body.opt.split(';');
        var ob={
            qu: req.body.qu,
            op:[]
        };
        op.forEach(function(val){
            ob.op.push({st: val, vot: 0});
        });
        mongo.connect(muri, function(err, db){
            if(err)
                throw err;
            else{
                db.collection('polls').insert(ob, function(err, results){
                    if(err)
                        throw err;
                    else{
                        var id=results.ops[0]._id;
                        db.collection('users').update({id: req.user.id}, {$addToSet:{polls: id}});
                        res.redirect('/');
                    }
                });
            }
        });
    });
}

function isauth(req, res, next){
    if(req.isAuthenticated())
        next();
    else
        res.redirect('/login');
}