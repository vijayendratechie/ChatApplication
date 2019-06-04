var express = require("express");
var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var bodyparser = require("body-parser");
var socket = require("socket.io");


var session = require("express-session");
var passport = require("passport");
var localStrategy = require("passport-local").Strategy;
var mySqlStore = require("express-mysql-session")(session);

var flash = require("connect-flash");
var app = express();


app.set("views", path.join(__dirname, "views"));
app.set("view engine","ejs");

//This creates a Session table in database to store established user session
/*var options = {
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'chat_application'
};
*/

/* For crearting sessions table in db to store user sessions */
var options = {
	host : 'us-cdbr-iron-east-02.cleardb.net',
	user : 'b1681473ab0ff1',
	password : '7f57f3dc',
	database : 'heroku_6b41e1e0702fd4d'
};

var mySessionStore = new mySqlStore(options);

app.use(bodyparser());
app.use(express.static(path.join(__dirname,"static")));



app.use(session({
	secret : 'key',
	resave : false,
	store : mySessionStore,
	saveUninitialized : false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

/* Authentication using local signup */
passport.use(new localStrategy({
	usernameField : 'email',
	passwordField : 'password',
	passReqToCallback : true
	},
	function(req,email,password,done)
	{
		//console.log(username + " " + password);
		
		db.query("SELECT id AS user_id from users WHERE email = ?",[email],function(err,result,fields)
		{
			if(err)
			{
				console.log("Error while retreiving id: " + err)
			}
			else
			{
				//console.log("email exists " + JSON.stringify(result));
				if(result.length == 0)
				{
					return done(null,false , {message : "User does not exists"});
				}
				else
				{
					db.query("SELECT password,confirm from users WHERE email = ?",[email],function(err,result1,fields)
					{
						//console.log("db password" + JSON.stringify(result1[0].password));
						if(err)
						{
							return done(null,false);
						}
						else if(result1[0].confirm == 0)
						{
							return done(null,false,{message : "User not registered using local signup"});
						} 
						else if(result1[0].confirm == 1)
						{
							return done(null,false,{message : "Please confirm your email address"});
						}
						else if(result1[0].password != password )
						{
							console.log("incorrect");
							return done(null,false, {message : 'Wrong password'});
						}						
						else
						{
							return done(null,result[0]);
						}
					});
				}
			}
		});
		//display error message if not successfully logged in pending
	}		
));


// Db connection

/*var db = mysql.createConnection(
{
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'chat_application',
	multipleStatements: true
});
*/

var db_config = {
	host : 'us-cdbr-iron-east-02.cleardb.net',
	user : 'b1681473ab0ff1',
	password : '7f57f3dc',
	database : 'heroku_6b41e1e0702fd4d',
	multipleStatements: true
}


/*db.connect(function(err)
{
	if(err)
	{
		console.log("database connection failed");
	}
	else
	{
		console.log("database connection established");
	}
})*/

var db;

function handleDisconnect() {
  db = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  db.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }									  // to avoid a hot loop, and to allow our node script to
    else  								  // process asynchronous requests in the meantime.						
    { 									  // If you're also serving http, display a 503 error.			
    	console.log("database connection established");
    }                                     
  });                                     
                                          
  db.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();


app.get("/logout",authenticationMiddleware(),function(req,res)
{
	req.logout();
	req.session.destroy();
	res.redirect("/");
});


app.get("/",function(req,res) 
{	
		//res.render("signup")
		res.sendFile(__dirname + "/HS.html");
});


app.get("/login",function(req,res) 
{	
	//console.log("from signup : "+JSON.stringify(req.query.message));
	var confirmation_flag = req.query.message;
	if(confirmation_flag == 1)
	{
		res.render("login",{message : "This email address is already registered. Please confirm email address"});	
	}
	else if(confirmation_flag == 2)
	{
		res.render("login",{message : "This email address is already registered. Please login"});
	}
	else if(confirmation_flag == 'mailsent')
	{
		res.render("login",{message : "Confirmation Mail sent to registered mail address"});
	}
	else
	{
		res.render("login",{message : false});
	}		
});

app.post("/login",passport.authenticate(
	'local',{
	successRedirect : "/home",
	failureRedirect : "/failure",
	failureFlash : true
	}
));

app.get("/failure",function(req,res)
{
	res.render("login",{message : req.flash("error")});
})

app.post("/checkemail",function(req,res)
{
	//console.log("check email : "+JSON.stringify(req.body));
	var email = req.body.email;
	db.query("SELECT id AS user_id,confirm FROM users WHERE email = ?",[email],function(err,result)
	{
		if(err)
		{
			console.log("Error while checking email : "+err);
		}
		else
		{
			if(result.length == 0)
			{
				res.send({message : "email id does not exists"});
			}
			else if(result[0].confirm == 0) //email id exists because user has signed up using third party auth using the same mail id but has not done local signup
			{
				res.send({message : "Please do local signup"});	
			}
			else if(result[0].confirm == 2 && req.body.flag == "mail") //email id already confirmed
			{
				res.send({message : "email id already confirmed"});
			}
			else if(result[0].confirm == 1)
			{
				if(req.body.flag == "mail")	
				{
					var user_id = {user_id : result[0].user_id};
					//console.log(user_id);
					sendmail(user_id,'confirmation',0,email);
					res.send({message : "email send to registered email id"})
				}
				else if(req.body.flag == "password")
				{
					res.send({message : "Please confirm registered mail address"});	
				}
			}
			else if(req.body.flag == "password")
			{
				//console.log("password functionality");
				var user_id = {user_id : result[0].user_id};
				var OTP = generateOTP(email);
				//console.log(OTP[1]);
				//sendmail(user_id,'OTP',OTP[0],email);		
				res.send({message : OTP[1]})
			}
		}
	})
})

//Global varialbe resets when server restarts
var OTPmap = new Map();

function generateOTP(email)
{
	var timer;
	var OTP = 1234; //Generate Random value when in production;
	var generatedTime = Date.now();
	OTPmap.set(email,[OTP,generatedTime]);
	timer = generatedTime+60000;
	return [OTP,timer];
	//return [OTP,generatedTime];
}

//This function will run after certain time intervals and check for Expired OTP records in OTPmap. It will delete the 
//expired records from the map. Written for cleanizing of OTPmap.

/*setInterval(function()
{
	var currentTime = Date.now();
	//console.log("Each run");

	OTPmap.forEach(function(values,key)  
	{
		console.log("keys"+key);
		console.log("values"+values[1]);
		if(currentTime-values[1] > (1*60*1000))    //(5*60*1000 => mins*sec*millisec)
		{
			OTPmap.delete(key);
		}
	});

	console.log("map size is : "+OTPmap.size);

},20000)*/

function checkOTP(OTP,email)
{	
	//console.log(OTPmap.get(email));
	var value = OTPmap.get(email);
	var currentTime;
	if(OTPmap.has(email))
	{
		console.log("Email exists in map");
		currentTime = Date.now();
		if(currentTime-value[1] < 60000) //Expiry time for OTP 60 secs
		{
			if(value[0] == OTP)
			{
				OTPmap.delete(email);
				return 1; //OTP matched
			}
			else
			{
				return 0; //OTP did not match
			}
		}
		else
		{
			console.log("Deleting : "+currentTime-value[1]);
			OTPmap.delete(email);
			return 2; //Time limit Exceeded. Invalid
		}		
	}
	else
	{
		//console.log("Email does not exists in map");
		return 0; // Email does not exist	
	}	
}

app.post("/checkotp",function(req,res)
{
	//console.log("req : "+JSON.stringify(req.body));
	var status = checkOTP(req.body.otp,req.body.email);
	//console.log("flag is : "+flag);
	res.send({status : status});
});

app.post("/resetpassword",function(req,res)
{
	console.log("resetpassword data : "+JSON.stringify(req.body));
	db.query("UPDATE users SET password=? WHERE email=?",[req.body.newpassword,req.body.email],function(err)
	{
		if(err)
		{
			console.log("Error while storing new password : "+err);
		}
		else
		{
			//console.log("success");
			res.send({message : 'changed'});
		}
	});
});

app.get("/signup",function(req,res) 
{	
	res.render("signup");
});

app.get("/check_username",function(req,res)
{
	console.log("username is : "+ JSON.stringify(req.query.username));
	var username = req.query.username;
	var flag=0;
	db.query("SELECT username FROM users",function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving all usernames : "+err);
		}
		else
		{
			for(let i=0;i<result.length;i++)
			{
				if(username == result[i].username)
				{
					res.send("notavailable");
					flag=1;
				}
			}
			if(flag==0)
			{
				res.send("available");	
			}			
		}
	})
})


app.post("/signup",function(req,res)
{
	
		var username = req.body.username;
		var name = req.body.name;
		var email = req.body.email;
		var password = req.body.password;
		

		db.query("SELECT * FROM users WHERE email=?",[email],function(err,result)
		{
			if(err)
			{
				console.log("Error while checking if email exists : "+err);
			}
			else
			{
				//console.log("result1 is : "+JSON.stringify(result1));
			
				if(result.length == 0)
				{
					db.query('INSERT INTO users(username,name,password,confirm,email,gid) VALUES (?,?,?,1,?,0)',[username,name,password,email],
					function(err,result)
					{
						if(err)
						{
							console.log("\n error while inserting student data is " + err);
						}
						else
						{
							db.query('SELECT LAST_INSERT_ID() AS user_id',function(err,result,fields)
							{
								if(err)
								{
									console.log("\nError while retreiving last inserted id");
								}
								else
								{
									const user_id = result[0];
									console.log("last inserted user " + JSON.stringify(user_id));
									sendmail(user_id,'confirmation',0,email);
									
									res.redirect("/login?message=mailsent");	
									//res.send('<script>window.location.href="https://www.gmail.com";</script>');
									//res.redirect("https://www.gmail.com");
								}					
							});	
						}
					});
				}
				else if(result[0].confirm == 1)
				{
					//console.log("please confirm email");
					db.query('SELECT id AS user_id FROM users WHERE email = ?',[email],function(err,result,fields)
					{
						if(err)
						{
							console.log("\nError while retreiving last inserted id");
						}
						else
						{
							const user_id = result[0];
							console.log("last inserted user " + JSON.stringify(user_id));
							//sendmail(user_id,'confirmation',0,email);
							//req.login(user_id,function(err)
							//{
							//	res.redirect("/home");
							//})
							res.redirect("/login?message=1");	
						}					
					});
				}
				else if(result[0].confirm == 2)
				{
					console.log("user already exists. Please login");
					res.redirect("/login?message=2");
				}
				else if(result[0].confirm == 0)
				{
					
					db.query("UPDATE users SET username=?,name=?,password=?,confirm=1 WHERE email = ?; SELECT id AS 'user_id' FROM users WHERE email=?",[username,name,password,email,email],function(err,result)
					{
						if(err)
						{
							console.log("Error while updating user info then retreiving id of user : "+JSON.stringify(err));
						}
						else
						{
							var temp_user_id = result[1];
							var user_id = temp_user_id[0]; 
							
							sendmail(user_id,'confirmation',0,email);
							res.redirect("/login?message=mailsent");
						}
					})					
				}			
			}
		})
		//check display_name and user already exists in db using ajax before submitting form.
	
});

app.get("/profile",authenticationMiddleware(),function(req,res)
{		
	var id = req.user.user_id;
	
	var query = "SELECT username,name,email FROM users WHERE id = ?";
	db.query(query, [id],function(err,result,fields)
	{
		if(err)
		{
			console.log("\n Error while retreiving user profile info " + err);
		}
		else
		{
			res.render("profile",{info : result[0]});
		}
	});	
	
	//res.redirect("/jugaad/profile/" + req.user.user_id);
})


app.post("/profile",authenticationMiddleware(),function(req,res)
{
	var id = req.user.user_id;
	var username = req.body.username;
	
	db.query("UPDATE users SET username=? WHERE id= ?",[username,id],function(err,result)
	{
		if(err)
		{
			console.log("\nError while updating profile info " + err);
		}
		else
		{
			res.redirect("/home");
		}
	});
});



app.get("/home",authenticationMiddleware(),function(req,res,next)
{
	var id = req.user.user_id;	
	var username;
	//console.log("onlineusers",onlineusers);
	
	db.query("SELECT username FROM users WHERE id=? LIMIT 1",[id],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving username on home page : "+err);
		}
		else
		{
			username = result[0].username
			res.render("home",{username : username});			
		}
	});
});


const port=process.env.PORT || 3000
var server=app.listen(port,function()
{
	console.log("listen to port 3000");
});

/*  Socket connection for chat */
var onlineusers = {};
var io=socket(server);
io.on("connection",function(socket)
{
	console.log("socket connection established");

	socket.on("chat",function(data)
	{
		io.sockets.emit("chat",data);
	});

	socket.on("private_chat",function(data)
	{
		console.log("private_chat data is : "+JSON.stringify(data));
		//io.sockets.emit("chat",data);
		onlineusers[data.receiver].emit("private_chat",data)
	});

	socket.on("username",function(username)
	{
		
		/*if(onlineusers.indexOf(username) == -1)
		{
			console.log("adding user to onlineusers array");
			//onlineusers.push(username);
		}*/
		socket.username = username;
		onlineusers[socket.username] = socket; 
		sendlistofonlineusers();		
	});

	function sendlistofonlineusers()
	{
		//console.log(onlineusers);
		io.sockets.emit("onlineusers",Object.keys(onlineusers));
	}

	
	socket.on("disconnect",function()
	{
		console.log("name of user disconneted",socket.username);
		//onlineusers.splice(onlineusers.indexOf(socket.username),1);
		delete onlineusers[socket.username];
		sendlistofonlineusers();
	})
});



passport.serializeUser(function(user_id,done)
{
	done(null,user_id);
});
passport.deserializeUser(function(user_id,done)
{
	done(null,user_id);
});

function authenticationMiddleware()
{
	return (req,res,next) => 
	{
		if(req.isAuthenticated())
		{
			return next();
		}
		
		res.redirect("/");
	}	
}

//Google authentication

const googlestrategy = require("passport-google-oauth20");

app.get("/google",passport.authenticate("google",{
	scope : ['profile','email']
}))

app.get("/google/redirect",passport.authenticate("google"),function(req,res)
{
	console.log("Redirected from google: " +JSON.stringify(req.user));
	res.redirect("/home");		
})

passport.use(
		new googlestrategy({
	callbackURL : "/google/redirect",
	//clientID : "509493354821-07dog3pdnbtgtukjtv2pp568u8enimpj.apps.googleusercontent.com",
	//clientSecret : "OFaHAH2OHK2uREuCy6NP1Afs"
	clientID : "734132093263-07tbcmloe50fjlfp5darjqasmeb6jovs.apps.googleusercontent.com", //google credentials for hosting on heroku
	clientSecret : "ru8T55pLk0tEf9j2JKtCTZPd"
},function(accessToken,refreshToken,profile,done)
{
	console.log("redirect to passport");
	//console.log(JSON.stringify(profile));
	var email = profile.emails[0].value;
	var username = profile.displayName; 
	var googleid = profile.id;

	//console.log("emailid is: "+JSON.stringify(emailid));
	//console.log("displayName is: "+JSON.stringify(displayName));
	//console.log("googleid is: "+googleid);
	//console.log("id is: "+JSON.stringify(emailid) + " " +JSON.stringify(googleid)+" "+JSON.stringify(displayName));
	
	db.query("SELECT `id`AS user_id,`username`,`gid` FROM users WHERE email = ?",[email],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving id : "+ err);
		}
		else
		{
			//console.log("result is : "+ JSON.stringify(result[0].user_id));
			if(result.length != 0)
			{
				var userId = {user_id : result[0].user_id}
				if(result[0].gid == googleid)
				{
					done(null,userId);
				}
				else if(result[0].username === "")
				{
					db.query("UPDATE users SET username=?,name=?,gid=? WHERE id=?",[username,username,googleid,result[0].user_id],function(err,result2)
					{
						if(err)
						{
							console.log("Error while updating google id : "+err);
						}
						else
						{
							//console.log("in update displayname");
							done(null,userId);		
						}
					})
				}
				else
				{
					db.query("UPDATE users SET gid=? WHERE id=?",[googleid,result[0].user_id],function(err,result2)
					{
						if(err)
						{
							console.log("Error while updating google id : "+err);
						}
						else
						{
							//console.log("don't update displayname");
							done(null,userId);		
						}
					})	
				}									
			}
			else
			{
				db.query("INSERT INTO users(username,name,email,gid) VALUES (?,?,?)",[username,username,email,googleid],function(err,result1)
				{
					if(err)
					{
						console.log("Error while inserting student google auth info : "+err);
					}
					else
					{
						db.query("SELECT `id` AS user_id FROM users WHERE email = ?",[email],function(err,result2)
						{
							if(err)
							{
								console.log("Error while retreiving id for new google signup user : "+err);
							}
							else
							{
								done(null,result2[0]);
							}
						});
					}
				})
			}			
		}
	})	
}));


//TO send mail

var nodemailer = require('nodemailer');

function sendmail(user_id,flag,OTP,email)
{
	var id =	user_id.user_id;
	console.log("email while sending mail is : "+email);
	//console.log("id is: "+ JSON.stringify(window_name));
	var transporter = nodemailer.createTransport({
	  service: 'gmail',
	  auth: {
	    user: 'vijayendracourse@gmail.com',
	    pass: '1@testcourse'
	 },
     tls: {
            rejectUnauthorized: false
     }
	});	

	if(flag == 'confirmation')
	{
		var mailOptions = {
		  from: 'vijayendracourse@gmail.com',
		  to: email,
		  subject: 'Confirm your mail id',
		  //text: 'http://localhost:3000/confirmemail?user_id='+id
		  html : '<a href="https://testchaatapp.herokuapp.com/confirmemail?user_id='+id+'" return false;>Click me</a>'
		  //html : '<!DOCTYPE html><html><body><a onclick="myWindow()" href="http://localhost:3000/confirmemail?user_id=102" >click here</a><button type="button" onclick="window.close()">close</button><script>function myWindow(){ alert("closing window"); myWindow.close();}</script></body</html>'
		  //href="http://localhost:3000/confirmemail?user_id='+id+'"
		};	
	}
	else if(flag == 'OTP')
	{
		var mailOptions = {
		  from: 'vijayendracourse@gmail.com',
		  to: email,
		  subject: 'OTP to chane password',
		  //text: 'http://localhost:3000/confirmemail?user_id='+id
		  html : '<div> OTP is : '+OTP+'</div>'
		  //html : '<!DOCTYPE html><html><body><a onclick="myWindow()" href="http://localhost:3000/confirmemail?user_id=102" >click here</a><button type="button" onclick="window.close()">close</button><script>function myWindow(){ alert("closing window"); myWindow.close();}</script></body</html>'
		  //href="http://localhost:3000/confirmemail?user_id='+id+'"
		};	
	}

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	});
}

//In confirm column
//0-user has not signed up using local signup
//1-user has signed up using local signup but not confirmed mail id
//2-user has signed up using local signup and confirmed mail id


//check authentication parameter
app.get("/confirmemail",function(req,res)
{
	console.log("user id is : "+ JSON.stringify(req.query));
	var user_id = req.query;
	db.query("SELECT `confirm` FROM users WHERE id = ?",[req.query.user_id],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving confirm value : "+err);
		}
		else
		{
			console.log("result is : "+ JSON.stringify(result));
			if(result[0].confirm == 2)
			{
				//res.redirect("/login");
				res.send("Email id already confirmed");				
			}
			else if(result[0].confirm == 1) 
			{
				console.log("update 2 from 1"+ JSON.stringify(req.query.user_id));
				db.query("UPDATE users SET confirm = 2 WHERE id=?",[req.query.user_id],function(err,result)
				{
					if(err)
					{
						console.log("Error while updating confirm value : "+err)
					}
					else
					{
						req.login(user_id,function(err)
						{
							//res.redirect("/home");							
							res.send("Email id confirmed");
						})		
					}
				})				
			}
			else
			{
				//res.redirect("/signup");
				res.send("Email id confirmed");
			}	
		}		
	})
})

