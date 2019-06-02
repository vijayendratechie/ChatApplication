var express = require("express");
var express = require("express");
//var mysql = require("mysql");
var MySql = require('sync-mysql');


var assert = require('assert');
var fs = require("fs");
var path = require("path");
var bodyparser = require("body-parser");
var download = require("download-pdf");

var session = require("express-session");
var passport = require("passport");
var localStrategy = require("passport-local").Strategy;
var mySqlStore = require("express-mysql-session")(session);

var ischool_id = 323;

function msleep(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
function sleep(n) {
  msleep(n*1000);
}

var config = 	{
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'usa_hs'};

var flash = require("connect-flash");

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine","ejs");

//This creates a Session table in database to store established user session
var options = {
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'usa_hs'
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

passport.use(new localStrategy({
	usernameField : 'username',
	passwordField : 'password',
	passReqToCallback : true
	},
	function(req,username,password,done)
	{
		var err = null;
		console.log(username + " " + password);
		
		result = db.query("SELECT id AS user_id from student WHERE email = ?",[username]);
		{
			
			if(err)
			{
				console.log("\n Error while retreiving data " + err);
			}
			else
			{
				console.log("email exists " + JSON.stringify(result));
				if(result.length == 0)
				{
					return done(null,false , {message : "Username does not exists"});
				}
				else
				{
					result1 = db.query("SELECT password from student WHERE email = ?",[username])
					{
						console.log("db password" + JSON.stringify(result1[0].password));
						if(err)
						{
							return done(null,false);
						}
						else if(result1[0].password != password)
						{
							console.log("incorrect");
							return done(null,false, {message : 'Wrong password'});
						}
						else
						{
							return done(null,result[0]);
						}
					};
				}
			}
		};
		//display error message if not successfully logged in pending
	}		
));


// Db connection
var db = new MySql(
{
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'usa_hs'
});


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


app.get("/logout",authenticationMiddleware(),function(req,res)
{
	req.logout();
	req.session.destroy();
	res.redirect("/HS");
});


app.get("/HS",function(req,res) 
{	
		//res.render("signup")
		res.sendFile(__dirname + "/HS.html");
});


app.get("/login",function(req,res) 
{	
		res.render("login",{message : false});
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


app.get("/signup",function(req,res) 
{	
	var err = null;
	result = db.query("SELECT id,name FROM district")
	{
		if(err)
		{
			console.log("\n Error while retreiving district data " + err);
		}
		else
		{
			//console.log(result);
			res.render("signup",{
				district : result
			});
		}
	};
});

app.post("/signup",function(req,res)
{
	if(req.body.flag == 1)
	{
		
		var err = null;
		var district = req.body.district;
		
		console.log("\ndistrict: " + district);
		
		result = db.query("SELECT id,name FROM school WHERE district_id = ?",[district]);
		{
			if(err)
			{
				console.log("Error while retreiving data");
			}
			else
			{
				console.log("\nresult is : " + JSON.stringify(result));
				
				res.send(result);
				
			}
		}; 	
	}
	else
	{
		var date = req.body.year; 
		//console.log(date);
		var d = new Date(date);
		var yob = d.getFullYear();
		//console.log(s_year);

		var school_name = req.body.hs;
		console.log("school name" + school_name);
		//change database to US_hs current db = hs
		
		var display_name = req.body.display_name;
		var password = req.body.password;
		var email = req.body.email;
		var first_name = req.body.first_name;
		var last_name = req.body.last_name;
		var school_id = req.body.hs;
		var grade = req.body.grade;				
		var district_id = req.body.district;
		
		var err = null;
		
		//check display_name and user already exists in db using ajax before submitting form.

		result = db.query('INSERT INTO student(display_name,password,email,first_name,last_name,yob,school_id,grade) VALUES (?,?,?,?,?,?,?,?)',[display_name,password,email,first_name,last_name,yob,school_id,grade])
		{
			if(err)
			{
				console.log("\n error while inserting student data is " + err);
			}
			else
			{
				result = db.query('SELECT LAST_INSERT_ID() AS user_id')
				{
					if(err)
					{
						console.log("\nError while retreiving last inserted id");
					}

					const user_id = result[0];
					console.log("last inserted user " + JSON.stringify(user_id));
					req.login(user_id,function(err)
					{
						res.redirect("/home");
					})
								
								
				};	
			}
						
		};
		}
});



app.get("/profile",authenticationMiddleware(),function(req,res)
{
	var id = req.user.user_id;
	var err = null;
	
	var query = "SELECT st.display_name, st.email, st.first_name, st.last_name,st.yob,st.grade, d.id AS district_id, d.name AS district_name, sc.id AS school_id, sc.name AS school_name FROM student AS st,school AS sc,district AS d WHERE st.school_id = sc.id AND sc.district_id = d.id AND st.id = ?"
	result = db.query(query, [id])
	{
		if(err)
		{
			console.log("\n Error while retreiving user profile info " + err);
		}
		else
		{
			result1 = db.query("SELECT id,name FROM district WHERE id != ?",[result[0].district_id])
			{
				
				var district = result1;

				//console.log("\nstudent_info is " + JSON.stringify(result[0]));
				//console.log("\ndistrict_info is " + JSON.stringify(district));
				res.render("profile",{message : result[0] , district : district});
			}
		}
	};	
	
	//res.redirect("/jugaad/profile/" + req.user.user_id);
})


/*Use this dynamic route in future for each user. Error to correct - Css content not applied to profile view when rendered 
through dynamic route, but gets applied when rendered directly in profile route

app.get("/jugaad/profile/:id",function(req,res)
{
	res.render("profile");
});
*/

app.get("/district-school",function(req,res)
{
	//console.log("hi");
	var district_id = req.query.district;
	var err = null;
	//console.log(district_id);
	result = db.query("SELECT id,name FROM school WHERE district_id = ?",[district_id])
		{
			//console.log("result "+JSON.stringify(result));
			res.send(result);
		};
});

app.post("/profile",function(req,res)
{
	var id = req.user.user_id;
	var display_name = req.body.display_name;
	var email = req.body.email;
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var district = req.body.district;
	var hs = req.body.hs;
	var grade = req.body.grade;
	var year = req.body.year;

	var sql = "UPDATE student SET display_name=?,email=?,first_name=?,last_name=?,yob=?,school_id=?,grade=? WHERE id= ?";
	var err = null;
	
	err = db.query(sql,[display_name,email,first_name,last_name,year,hs,grade,id])
	{
		if(err)
		{
			console.log("\nError while updating profile info " + err);
		}
		else
		{
			res.redirect("/home");
		}
	};
});


//var subject = [{subject : 'history'},{subject : 'english'}];
var subject;
var year = [{YEAR : 9},{YEAR : 10},{YEAR : 11},{YEAR : 12}];

resultsetA = db.query("(SELECT DISTINCT `SUBJECT` FROM subjects LIMIT 2) UNION SELECT `SUBJECT` FROM subjects WHERE SUBJECT = 'MATHS'");
//const resultsetA = db.query("SELECT DISTINCT `SUBJECT` FROM subjects");
assert(resultsetA);
//console.log(resultsetA);
//db.query("SELECT DISTINCT `SUBJECT` FROM subjects",function(err,result)
{
	
	{
		//console.log(resultsetA);
		subject = resultsetA; // DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
	}
};

function Custom_Trim(str) {
	str = str.toString().replace(/\./g,' ');
    return str.toString().replace(/\s+/g,'');
}

var subjects_master;
resultsetA = db.query("SELECT * FROM tracks where school_id = ? order by track_seq LIMIT 5",[ischool_id]);
//const resultsetA = db.query("SELECT DISTINCT `SUBJECT` FROM subjects");
assert(resultsetA);
//console.log(resultsetA);
//db.query("SELECT DISTINCT `SUBJECT` FROM subjects",function(err,result)
{
	
	{
		//console.log(resultsetA);
		subjects_master = resultsetA; // DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
	}
};
subject =[];
for(var j=0;j<subjects_master.length;j++)
{
	var str = subjects_master[j].TRACK_ID;
	var str = Custom_Trim(str);
	subject.push(
	{						
		SUBJECT : str
	});
						
}
//console.log(subject);

var years_master;
resultsetA = db.query("SELECT * FROM years where SCHOOL_ID = ? order by year_seq",[ischool_id]);
//const resultsetA = db.query("SELECT DISTINCT `SUBJECT` FROM subjects");
assert(resultsetA);
//console.log(resultsetA);
//db.query("SELECT DISTINCT `SUBJECT` FROM subjects",function(err,result)
{
	
	{
		//console.log(resultsetA);
		years_master = resultsetA; // DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
	}
};
//console.log(years_master);
year =[];
for(var j=0;j<years_master.length;j++)
{
	var str = years_master[j].YEAR_ID;
	var str = Custom_Trim(str);

	year.push(
	{						
		YEAR : str
	});
}
//console.log(year);



app.get("/home",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	//console.log(subject);
	var display_name;
	var err = null;
	const resultsetA = db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id]);
	assert(resultsetA);
	//console.log(resultsetA);
	{	
		
		if(err)
		{
			console.log("\nError while executing the query " + err);
		}
		else
		{
			display_name = resultsetA[0].display_name;
			//res.render("home",{display_name : display_name});
			res.locals.display_name = display_name;
			next();
		}
	};
},function(req,res)
{
	var err = null;
	const resultsetA = db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND status != 'delete'",[req.user.user_id]);
	assert(resultsetA);
	//console.log(resultsetA);
	{
		if(err)
		{
			console.log("\nError while executing the query " + err);
		}
		else
		{
			const resultsetB =  db.query("SELECT scenario_name,fav,status FROM scenario_name WHERE student_id = ? AND status != 'delete'",[req.user.user_id]);
			assert(resultsetA);
			//console.log(resultsetA);
			{
				
				
				{
					//console.log(result);
					res.render("home",{display_name : res.locals.display_name, data : resultsetA, year: subjects_master, subject : subjects_master,scenario_name : resultsetB});
				}
			};			
		}
	};	 	
});

app.get("/sent_fav_flag",function(req,res)
{
	//console.log(req.query.scenario_name + " " + req.query.fav_flag);
	var err = null;
	if(req.query.fav_flag == 0)
	{
		result = db.query("UPDATE scenario_name SET fav = 0 WHERE scenario_name = ? AND	student_id	= ?",[req.query.scenario_name,req.user.user_id]);
		{
			if(err)
			{
				console.log("error while updating fav scenario " + err);
			}
			else
			{
				res.send(false);			
			}
		};	
	}
	else if(req.query.fav_flag == 1)
	{
		result1 = db.query("SELECT scenario_name FROM scenario_name WHERE fav = 1 AND student_id = ? AND status != 'delete'",[req.user.user_id]);
		{
			
				if(err)
				{
					console.log("\nError while executing the query " + err);
				}
				else
{
				//console.log("result1 is "+ JSON.stringify(result1));
				if(result1.length == 0)
				{
					result1 = db.query("UPDATE scenario_name SET fav=1 WHERE scenario_name = ? AND student_id = ? AND status != 'delete'",[req.query.scenario_name,req.user.user_id]);
					{
						if(err)
						{
							console.log("error while updating fav scenario to 1 " + err);
						}
						else
						{
							result1 = db.query("UPDATE scenario_name SET fav=0 WHERE scenario_name != ? AND student_id = ? AND status!= 'delete'",[req.query.scenario_name,req.user.user_id]);
							{
								if(err)
								{
									console.log("error while updating fav scenario to 0" + err);			
								}
								else
								{
									res.send(false);		
								}
							};										
						}
					};	
				}
				else
				{
					result1 = db.query("UPDATE scenario_name SET fav=1 WHERE scenario_name = ? AND student_id = ? AND status != 'delete'",[req.query.scenario_name,req.user.user_id]);
					{
						if(err)
						{
							console.log("error while updating fav scenario to 1 " + err);
						}
						else
						{
							result1 = db.query("UPDATE scenario_name SET fav=0 WHERE scenario_name != ? AND student_id = ? AND status != 'delete'",[req.query.scenario_name,req.user.user_id]);
							{
								if(err)
								{
									console.log("error while updating fav scenario to 0" + err);			
								}
								else
								{
									//console.log("scenario name : " + JSON.stringify(result1[0]));
									res.send(result1[0]);		
								}
							};										
						}
					};	
				}				
			}
		};		
	}
});



app.get("/create",authenticationMiddleware(),function(req,res)
{	
	res.render("create_scene",{subject : subject,year: year});
	
	/*res.render("create_scenario",{no_of_years : no_of_years, no_of_subjects : no_of_subjects, subject : subject, year: year});*/
});

//NOT IN USE 
app.get("/grade-subject",authenticationMiddleware(),function(req,res)
{
	//sub = [{subject : "history1"},{subject : "history2"}];
	var sub_track=[];
	var err = null;

	result = db.query("SELECT * FROM subjects");
	{
		if(err)
		{
			console.log("Error while retreiving subject info : " + err);
		}
		else
		{
			
			console.log(subject);
			for(var j=0;j<subject.length;j++)
			{
				
				var arr = [];
				for(var i=0;i<result.length;i++)
				{
					if(subject[j].subject == result[i].SUBJECT)
					{
						arr.push(result[i].COURSE_ID+ " - " +result[i].NAME);  
					}
				}

				//console.log(arr);
				sub_track.push(arr);
			}

			//console.log("\nsub_track is : " + JSON.stringify(sub_track));	
			//console.log(sub_track[1][1]);

			res.send(sub_track);
		}
	};
	//res.send(sub);
});

app.get("/get_year",authenticationMiddleware(),function(req,res)
{
	
//	console.log(year);
	res.send(year);
})

app.get("/get_distinct_subjects",authenticationMiddleware(),function(req,res)
{
	res.send(subject);
})

//Not in use
app.get("/y9_sENGLISH",function(req,res)
{
	var err = null;
	result = db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM `subjects` WHERE `MANDATORY` = 'yes' AND `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT = 'ENGLISH'");
	{
		if(err)
		{
			console.log("Error while retreiving English year 9 mandatory subject : "+ err);
		}
		else
		{
			if(result.length != 0)
			{
				//console.log("9 mand are : "+JSON.stringify(result));
				res.send(result);
			} 
			else
			{
				result = db.query("SELECT `COURSE_ID`,`NAME` FROM `subjects` WHERE `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT = 'ENGLISH'");
				{
					if(err)
					{
						console.log("Error while retreiving year 9 English data: "+err);
					}
					else
					{
						res.send(result);
					}
				}
			}
		}
	}
});

app.get("/allSubjectsFirstYear",function(req,res)
{
	var err = null;
	result = db.query("SELECT `COURSE_ID`,`NAME`,`SUBJECT`,`MANDATORY` FROM `subjects` WHERE `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT IN ('ENGLISH','HISTORY','MATHS')");
	{
		if(err)
		{
			console.log("Error while retreiving MANDATORY year 9 mandatory subject : "+ err);
		}
		else
		{
			res.send(result);
		}
	}
});

//maths first year
app.get("/firstYear",function(req,res)
{
	var err = null;
	result = db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM `subjects` WHERE `MANDATORY` = 'yes' AND `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT = ?",[req.query.subject]);
	{
		if(err)
		{
			console.log("Error while retreiving MANDATORY year 9 mandatory subject : "+ err);
		}
		else
		{
			if(result.length != 0)
			{
				//console.log("9 mand are : "+JSON.stringify(result));
				res.send(result);
			} 
			else
			{
				result = db.query("SELECT `COURSE_ID`,`NAME` FROM `subjects` WHERE `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT = 'MATHS'");
				{
					if(err)
					{
						console.log("Error while retreiving year 9 MATHS data: "+err);
					}
					else
					{
						res.send(result);
					}
				}
			}
		}
	}
});

app.get("/toFillDataInCell",function(req,res)
{
	console.log("info to fill 11 dropdown " + JSON.stringify(req.query));
  	var arr = [];
  	var selected_course_id_arr = [];
  	var pre_req_subjects_arr = [];
	var err = null;
  	//check for mandet subjects here if no mandet then call the below with function call

  	result = db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM `subjects` WHERE `MANDATORY` = 'yes' AND `LGRADE` <= ? AND `HGRADE` >= ? AND SUBJECT = ?",[req.query.grade,req.query.grade,req.query.subject]);
	{
		if(err)
		{
			console.log("Error while retreiving MANDATORY year 9 mandatory subject : "+ err);
		}
		else
		{
			if(result.length != 0)
			{
				//console.log("9 mand are : "+JSON.stringify(result));
				res.send(result);
			} 
			else
			{
				console.log("not mandat");
				result = db.query("SELECT `COURSE_ID` FROM `subjects` WHERE NAME IN (?)",[req.query.data]);
			  	{
			  		if(err)
			  		{
			  			console.log("Error while fetching grade 11 course_id " + err);
			  		}
			  		else
			  		{
			  			selected_course_id = result;
			  			console.log("selected course_id : "+JSON.stringify(result));

			  			for(let i=0;i<result.length;i++)
			  			{
			  				selected_course_id_arr.push(result[i].COURSE_ID);
			  			}

			  			// Query to form array of pre-requisites of all selected subjects so that it can be elimenated.
			  			result = db.query("SELECT DISTINCT `COURSE` FROM `PREREQUISITES` WHERE `REQ` = 'COURSE_PREREQUISITES' AND `CORE` IN (?)",[selected_course_id_arr]);
						{
							if(err)
							{
								console.log("Error while retreiving PREREQUISITES of a subject chosen : "+err)
							}
							else
							{
								console.log("distinct pre_req for 11 are : "+JSON.stringify(result));

								for(let i=0;i<result.length;i++)
								{
									
									pre_req_subjects_arr.push(result[i].COURSE);
								}

								console.log("all pre_req are : " + JSON.stringify(pre_req_subjects_arr));	

								(function loop(j)
								{
								    if(j >= pre_req_subjects_arr.length)
								    {  // all "iterations" done!
								    	console.log("pre_req_subjects_arr is " + JSON.stringify(pre_req_subjects_arr));
								    	subjectToDisplay();
								        return;
								    }
								    
								    //console.log("j is : "+j);

								    preOfPreReq = db.query("SELECT DISTINCT `COURSE` FROM `PREREQUISITES` WHERE `REQ` = 'COURSE_PREREQUISITES' AND `CORE` = ?",[pre_req_subjects_arr[j]]) ;
								    {
								        if(err)
								        {
								            console.log("Error while creating array of pre_req subjects : " + err);
								        }
								        else
								        {
								            //console.log("j inside db query : "+j);

											
											if(preOfPreReq.length != 0)
											{
												//console.log("pre_req of first pre_req : "+JSON.stringify(preOfPreReq));

												for(let x=0;x<preOfPreReq.length;x++)
												{
													var check_flag = 0;
													//console.log("course "+x+" is : "+JSON.stringify(preOfPreReq[x].COURSE))
													
													for(let y=0;y<pre_req_subjects_arr.length;y++)
													{
														//console.log("check for : "+y);
														if(preOfPreReq[x].COURSE == pre_req_subjects_arr[y])
														{
															check_flag = 1;
															//console.log("matched"+x+" is : "+JSON.stringify(preOfPreReq[x].COURSE))
															break;
														}
													}
													if(check_flag == 0)
													{
														pre_req_subjects_arr.push(preOfPreReq[x].COURSE);
														//console.log("length"+JSON.stringify(pre_req_subjects_arr.length))
													}
												}
											}
								        }
								        loop(j+1); // Only now call the next "iteration"
								    }                
								})(0);
							}
						}
			  		}
			  	}			
			}
		}
	};
  	 
  	function subjectToDisplay()
  	{
  		var sqlQuery;
		var err = null;
  		if(pre_req_subjects_arr.length == 0)
  		{
  			sqlQuery = "SELECT COURSE_ID,NAME,SUBJECT FROM subjects WHERE LGRADE <= ? AND HGRADE >= ? AND NAME NOT IN (?)"; 
  		}
  		else
  		{
  			sqlQuery = "SELECT COURSE_ID,NAME,SUBJECT FROM subjects WHERE LGRADE <= ? AND HGRADE >= ? AND NAME NOT IN (?) AND COURSE_ID NOT IN (?)";
  		}		

  		
		y10_sub = db.query(sqlQuery,[req.query.grade,req.query.grade,req.query.data,pre_req_subjects_arr]);
		{
			
			if(err)
			{
				console.log("Error while retreiving year 10 MATHS data: "+err);
			}
			else
			{
				//console.log("all subjects are " + JSON.stringify(y10_sub));
				 
				//console.log("remaining subjects are: " + JSON.stringify(y10_sub));
				for(let i = 0;i<y10_sub.length;i++)
				{
					console.log("Value of i oustide db query : "+ i);
					pre_req = db.query("SELECT p.`REQ_CONDITION`,p.`COURSE`,s.`SUBJECT` FROM `PREREQUISITES` AS p,`SUBJECTS` AS s WHERE p.`CORE` = s.`COURSE_ID` AND `REQ` = 'COURSE_PREREQUISITES' AND `CORE` = ?",[y10_sub[i].COURSE_ID]);
					{
						
						
						if(err)
						{
							console.log("Error while retreiving PREREQUISITE info for sub_track : " + err);
						}
						else
						{
							//console.log("ii : " + i);	
							//console.log("pre_req condition are : " + JSON.stringify(pre_req));	
							//condition_check(result1,);
							if(pre_req.length == 0 && y10_sub[i].SUBJECT == req.query.subject)
							{
								console.log("Value of i is : "+i);
								console.log("Subject has no pre-requisites in maths : "+y10_sub[i].NAME);

								arr.push({ COURSE_ID : y10_sub[i].COURSE_ID, NAME : y10_sub[i].NAME, SUBJECT : y10_sub[i].SUBJECT});
								//console.log(arr);
							
							} 	
							else
							{
								for(let j=0;j<pre_req.length;j++)
								{
									var flag = 0;	
									if(pre_req[j].REQ_CONDITION == 'OR')
									{
										
										for(var k=0;k<selected_course_id.length;k++)
										{
											//console.log( pre_req[j].COURSE + " " + selected_course_id[k].COURSE_ID);
											if(pre_req[j].COURSE == selected_course_id[k].COURSE_ID)
											{	
												flag = 1;
												arr.push({ COURSE_ID : y10_sub[i].COURSE_ID, NAME : y10_sub[i].NAME, SUBJECT : y10_sub[i].SUBJECT});
												//console.log("yessss "+ arr);

												console.log("Value of i is : "+i);
												console.log("Subject has pre-requisites in maths : "+y10_sub[i].NAME);

												break;
											}	
										}
									}
									if(flag != 0)
									{
										//console.log("flag : " + flag);
										break;
									}
								} 
							}	
							//console.log("\n\n ");
						}

						if(i== y10_sub.length-1)
						{
							//displayResult();
							console.log("arr is : " + JSON.stringify(arr));
							res.send(arr);
						}

					}					
				}
			}						
		}
	}	
});


function custom_print(myincomingarray)
{
	//console.clear() ;
	console.log("result is : "+ myincomingarray.length) ;	
	for(let j=0;j<myincomingarray.length;j++)
	{
		console.log("result is : "+ JSON.stringify(myincomingarray[j])) ;	
	}

}

app.get("/GetAllCourses",function(req,res)
{
	var RecordsForEntireGrid = [];	
	var AvailableSubjects = [];
	var AvailableSubjectsCopy = [];
	var SelectedSubjectID;
	var SelectedSubjectName;
	var InputSelectedSubjectID;
	var InputSelectedSubjectName;
	var ListOfAllSelected = [];
	var iAlreadyAdded =false;
	var result =[];
	var resultset2 =[];
	var iAlreadySelected = "NO";
	//var temp = JSON.stringify(req.query.arrayOfAllGridInfo);
	
	//console.log("result is : "+JSON.stringify(req.query.arrayOfAllGridInfo));
	//console.log("result is 11: "+req.query.arrayOfAllGridInfo.length);
	//console.log("result is 1121212: "+temp);
	//console.log("result is 2312: "+temp.length);
	for(let i=0;i<req.query.arrayOfAllGridInfo.length;i++)	{
			
			
			const result = db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM subjects WHERE SCHOOL_ID = 323 AND replace(replace(SUBJECT,' ',''),'.','') = ? AND LGRADE <= ? AND HGRADE >= ? AND (COURSE_ID NOT IN (SELECT DISTINCT IFNULL(CORE,'-100') FROM prerequisites  WHERE REQ = 'COURSE_PREREQUISITES') OR LGRADE=?)",[req.query.arrayOfAllGridInfo[i].SUBJECT,req.query.arrayOfAllGridInfo[i].GRADE,req.query.arrayOfAllGridInfo[i].GRADE,req.query.arrayOfAllGridInfo[i].GRADE]);
			assert(result);
			//sleep(1); // sleep for ten seconds
			//console.log("result is : "+JSON.stringify(result));
							
				AvailableSubjects = [];
				AvailableSubjectsCopy =[];
				SelectedSubjectID = null;
				SelectedSubjectName = null;
				
				if (req.query.arrayOfAllGridInfo[i].SelectedSubjectID != null)
				{
					InputSelectedSubjectID = req.query.arrayOfAllGridInfo[i].SelectedSubjectID	
					//console.log(InputSelectedSubjectID);
				}
				
				if (req.query.arrayOfAllGridInfo[i].SelectedSubjectName !=  null)
				{
					InputSelectedSubjectName = req.query.arrayOfAllGridInfo[i].SelectedSubjectName					
				}
								
				
				{
					//console.log("result is : "+JSON.stringify(result));
					//console.log("Query for Subject: " + req.query.arrayOfAllGridInfo[i].SUBJECT + " Year: " + req.query.arrayOfAllGridInfo[i].GRADE + " SELECTED: " + req.query.arrayOfAllGridInfo[i].SELECTED);
					//custom_print (result);
					
					for(var j=0;j<result.length;j++)
					{
						iAlreadySelected = "NO";
						if(result[j].MANDATORY == 'YES')
						{
							SelectedSubjectName = result[j].NAME;			
							SelectedSubjectID = result[j].COURSE_ID;								
							
							AvailableSubjects = [];
							iEmptyAllowed = 'NO';
							
							break;
						}												
						if(result[j].NAME == InputSelectedSubjectName)
						{
							SelectedSubjectName = result[j].NAME;
							SelectedSubjectID = result[j].COURSE_ID;							
						}
						else {
							for(var m=0;m<ListOfAllSelected.length;m++)
							{
								if(ListOfAllSelected[m].SELECTEDID == result[j].COURSE_ID)
								{
									iAlreadySelected = "YES";	
								}
								
							}
							if(iAlreadySelected=="NO")
							{
								AvailableSubjects.push(
								{	SUBTRACK_ID : result[j].COURSE_ID,
									SUBTRACK_NAME : result[j].NAME
								})	;
							}
												
						}
					}
					
					if(SelectedSubjectID != null) {
						//console.log("Backend Final Array is 1: "+ req.query.arrayOfAllGridInfo[i].GRADE + req.query.arrayOfAllGridInfo[i].SUBJECT + SelectedSubjectID + SelectedSubjectName);
						ListOfAllSelected.push(
						{						
							GRADE : req.query.arrayOfAllGridInfo[i].GRADE,
							SUBJECT : req.query.arrayOfAllGridInfo[i].SUBJECT,						
							SELECTEDID : SelectedSubjectID,
							SELECTEDNAME : SelectedSubjectName,
						});
						//console.log("Backend Final Array is 2: "+ ListOfAllSelected.length);
					}
						RecordsForEntireGrid.push(
						{						
							GRADE : req.query.arrayOfAllGridInfo[i].GRADE,
							SUBJECT : req.query.arrayOfAllGridInfo[i].SUBJECT,						
							SELECTEDID : SelectedSubjectID,
							SELECTEDNAME : SelectedSubjectName,
							AVAILABLECOURSES : AvailableSubjects							
						});	
				}
			
	}		
				//console.log("Backend Final Array is : 55552: "+ JSON.stringify(RecordsForEntireGrid));
				//console.log("Backend Final Array is 4: "+ ListOfAllSelected.length);
				//console.log("Backend Final Array is : 3"+ JSON.stringify(ListOfAllSelected));
				for(var v=0;v<ListOfAllSelected.length;v++)	{
					//console.log("11"+ListOfAllSelected[v].GRADE,ListOfAllSelected[v].GRADE,ListOfAllSelected[v].SELECTEDID);
					const resultset2 = db.query("SELECT DISTINCT subjects.COURSE_ID, subjects.NAME, subjects.LGRADE, subjects.HGRADE, subjects.SUBJECT FROM prerequisites join subjects on prerequisites.school_id = subjects.school_id AND prerequisites.REQ = 'COURSE_PREREQUISITES' AND prerequisites.core = subjects.COURSE_ID AND prerequisites.SCHOOL_ID = 323 AND LGRADE >= ? AND HGRADE > ? and prerequisites.course in (?)",[ListOfAllSelected[v].GRADE,ListOfAllSelected[v].GRADE,ListOfAllSelected[v].SELECTEDID]);
					//console.log(resultset2);
					//console.log("Backend Final Array is : 3"+ JSON.stringify(resultset2));
					/*setTimeout(function() {
					}, 1000);
					*/
					{
						
						{	
								localresultset = resultset2;
								//console.log("set2: " + resultset2);
								//console.log("Backend Final Array is 9: "+ resultset2);
								for(var w=0;w<resultset2.length;w++)
								{
									//console.log(resultset2);
									//console.log("44"+JSON.stringify(resultset2[w].course_id));
									iAlreadyAdded = false
									for(var u=0;u<RecordsForEntireGrid.length;u++)	{
										//console.log("3"+resultset2[w].NAME + resultset2[w].COURSE_ID);
										if(RecordsForEntireGrid[u].SUBJECT == resultset2[w].SUBJECT && RecordsForEntireGrid[u].GRADE > resultset2[w].LGRADE) {
											if(RecordsForEntireGrid[u].SELECTEDID == resultset2[w].COURSE_ID) {
												iAlreadyAdded = true
											}
											else {								
												for (let l=0;l<RecordsForEntireGrid[u].AVAILABLECOURSES.length;l++)	{
													if(RecordsForEntireGrid[u].AVAILABLECOURSES[l] == resultset2[w].COURSE_ID) {
														iAlreadyAdded = true
														break;
													}
												}
											}
											//console.log("iAlreadyAdded:"+iAlreadyAdded);
												
												if(iAlreadyAdded == false) {
												//console.log(resultset2[w].NAME + resultset2[w].COURSE_ID);
												//console.log("a"+RecordsForEntireGrid[u].AVAILABLECOURSES.length);
												//console.log("Backend Final Array is : "+ JSON.stringify(RecordsForEntireGrid[u].AVAILABLECOURSES));
												AvailableSubjectsCopy = RecordsForEntireGrid[u].AVAILABLECOURSES;	
												
												AvailableSubjectsCopy.push(
												{	SUBTRACK_ID : resultset2[w].COURSE_ID,
													SUBTRACK_NAME : resultset2[w].NAME
												})	;	
												//console.log("Backend Final Array is : "+ JSON.stringify(AvailableSubjectsCopy));
											
												RecordsForEntireGrid[u].AVAILABLECOURSES = AvailableSubjectsCopy;
												//console.log("Backend Final Array is :222: "+ JSON.stringify(RecordsForEntireGrid[u]));
												
												//console.log("Backend Final Array is : 1234:"+ JSON.stringify(RecordsForEntireGrid));											
																	
											}
										}
								
									}
								}

					
						}
					}
	//console.log("all grid info : "+JSON.stringify(req.query));
				}
				
				
				
				//console.log("Backend Final Array is : 55551: "+ JSON.stringify(RecordsForEntireGrid));
					
		//console.log("FINAL OUTPUT");
		//console.log("Backend Final Array is : 55551: "+ JSON.stringify(RecordsForEntireGrid));
		res.send(RecordsForEntireGrid);
		return;
		
});

app.get("/scenario_name",authenticationMiddleware(),function(req,res)
{
	var scenario_name =	req.query.scenario_name;
	var flag = 0;
	//console.log(scenario_name);
	var err = null;
	
	result = db.query("SELECT scenario_name FROM scenario_name WHERE student_id=? AND status='save'",[req.user.user_id]);
	{
		if(err)
		{
			console.log("Error while retreiving scenario_names: " + err);
		}
		else
		{
			for(var i=0;i< result.length;i++)
			{
				if(scenario_name == result[i].scenario_name)
				{
					console.log("scenario_name already exists");
					flag = 1;
					break;
				}
			}
			if(flag == 1)
			{
				res.send({err_flag : 1});
			}
			else
			{
				res.send({err_flag : 0});
			}
		}
	};
});


app.post("/create",authenticationMiddleware(),function(req,res)
{
	var status = req.body.status;
	var scenario_name = req.body.scenario_name;
	var j=0;
	var err = null;
	
	console.log(req.body);

	var next_scenario_no;

	var grade_course = [];

	for(var i=0;i< (year.length * subject.length);i++)
	{
		grade_course.push({
			grade : req.body.grid[i],
			course_id : req.body.subject[i]
		});
	}

	//console.log(grade_course);

	result1 = db.query("SELECT `scenario_no` FROM scenario WHERE `student_id` = ? ORDER BY `scenario_no` DESC LIMIT 1",[req.user.user_id]);
	{
		if(err)
		{
			console.log("Error while last_scenario_no "+ err);
		}
		else
		{
			
			if(result1.length == 0)
			{
				next_scenario_no = 1;
				//console.log("next scenario_no: "+ next_scenario_no);
			}
			else
			{
				next_scenario_no = result1[0].scenario_no + 1;
				//console.log("next scenario_no: "+ next_scenario_no);
			}
				for(var i=0;i<grade_course.length;i++)
			{	
				//console.log("grade: "+ grade_course[i].grade + " course_id: "+ grade_course[i].course_id);
				var insert_query="INSERT INTO `scenario`(`student_id`, `scenario_no`, `status`, `grade`, `course_id`) VALUES (?,?,?,?,?)";
				result2 = db.query(insert_query,[req.user.user_id,next_scenario_no,status,grade_course[i].grade,grade_course[i].course_id]);
				{
					if(err)
					{
						console.log("Error while inserting data " + err);
						res.redirect("/create");
					}
				};
			}

			result3 = db.query("INSERT INTO scenario_name(`student_id`, `scenario_no`, `status`,`scenario_name`) VALUES (?,?,?,?)",[req.user.user_id,next_scenario_no,status,scenario_name]);
			{
				if(err)
				{
					console.log("Error while inserting scenario_name " + err);
				}
			};
				
				// redirecting outside the above query will create a problem when result not inserted in db
			res.redirect("/home");
		}
	};
});


app.post("/delete",authenticationMiddleware(),function(req,res)
{
	var scenario_no = req.body.delete;
	var page_name = req.body.page_name;
	console.log("scenario_no "+ scenario_no);
	var err = null;
	
	result = db.query("UPDATE scenario SET status='delete' WHERE student_id = ? AND scenario_no = ?",[req.user.user_id,scenario_no]);
	{
		if(err)
		{
			console.log("Error while updating delete status: " + err);
		}		
	};	

	result = db.query("UPDATE scenario_name SET status='delete' WHERE student_id = ? AND scenario_no = ?",[req.user.user_id,scenario_no]);
	{
		if(err)
		{
			console.log("Error while updating delete status");
		}
		else
		{
			if(page_name == "home")
			{
				res.redirect("/home");	
			}
			else if(page_name == "save")
			{
				res.redirect("/save");	
			}	
			else if(page_name == "draft")
			{
				res.redirect("/draft");	
			}
			else
			{
				res.redirect("/home");
			}		
		}
	};
});

app.get("/save",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	var display_name;
	var err = null;
	result = db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id]);
	{	
		if(err)
		{
			console.log("Error while retreiving display_name");
		}
		else
		{
			display_name = result[0].display_name;
			//res.render("home",{display_name : display_name});
			res.locals.display_name = display_name;
			next();
		}
	};
},function(req,res)
{
	var err = null;
	result = db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND status = 'save'",[req.user.user_id]);
	{
		if(err)
		{
			console.log("Error while retreiving scenario info : "+err);
		}
		else
		{
			result1 = db.query("SELECT scenario_name FROM scenario_name WHERE student_id = ? AND status = 'save'",[req.user.user_id])
			{
				if(err)
				{
					console.log("Error while retreiving scenario_name "+ err);
				}
				else
				{
					console.log(result);
					res.render("save",{display_name : res.locals.display_name, data : result, year: year, subject : subject,scenario_name : result1});
				}
			};			
		}
	};
});

app.get("/draft",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	var display_name;
	var err = null;
	
	result = db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id]);
	{	
		if(err)
		{
			console.log("Error while retreiving display_name");
		}
		else
		{
			display_name = result[0].display_name;
			//res.render("home",{display_name : display_name});
			res.locals.display_name = display_name;
			next();
		}
	};
},function(req,res)
{
	var err = null;
	
	result = db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND status = 'draft'",[req.user.user_id]);
	{
		if(err)
		{
			console.log("Error while retreiving scenario info : "+err);
		}
		else
		{
			result1 = db.query("SELECT scenario_name FROM scenario_name WHERE student_id = ? AND status = 'draft'",[req.user.user_id]);
			{
				if(err)
				{
					console.log("Error while retreiving scenario_name "+ err);
				}
				else
				{
					//console.log(result);
					res.render("draft",{display_name : res.locals.display_name, data : result, year: year, subject : subject,scenario_name : result1});
				}
			};			
		}
	};
});

app.get("/search",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	var display_name;
	var err= null;
	
	result = db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id]);
	{	
		if(err)
		{
			console.log("Error while retreiving display_name");
		}
		else
		{
			display_name = result[0].display_name;
			//res.render("home",{display_name : display_name});
			res.locals.display_name = display_name;
			next();
		}
	};
},function(req,res)
{
	var search_name = req.query.search_name;
	var err = null;
	
	result2 = db.query("SELECT scenario_no,scenario_name FROM scenario_name WHERE student_id = ? AND scenario_name = ?",[req.user.user_id,search_name]);
	{
		if(err)
		{
			console.log("Eror while retreiving scenario_name in search : " + err);
		}
		else
		{
			if(result2.length == 0)
			{
				res.render("search",{display_name : res.locals.display_name, data : 0, year: year, subject : subject,scenario_name : 0});
			}
			else
			{
				result = db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND scenario_no=?",[req.user.user_id,result2[0].scenario_no]);
				{
					if(err)
					{
						console.log("Error while retreiving search scenario info : "+err);
					}
					else
					{
						console.log(result2);
						res.render("search",{display_name : res.locals.display_name, data : result, year: year, subject : subject,scenario_name : result2});
					}
				};
			}
		}
	};	
});

app.get("/fav_scenario",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	var display_name;
	var err = null;
	
	result = db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id]);
	{	
		if(err)
		{
			console.log("Error while retreiving display_name");
		}
		else
		{
			display_name = result[0].display_name;
			//res.render("home",{display_name : display_name});
			res.locals.display_name = display_name;
			next();
		}
	};
},function(req,res)
{
	var err = null;
	result1 = db.query("SELECT scenario_name,scenario_no FROM scenario_name WHERE student_id = ? AND fav = 1 AND status != 'delete'",[req.user.user_id]);
	{
		if(err)
		{
			console.log("Error while retreiving scenario no of fav scenario : "+err);
		}
		else
		{
			if(result1.length == 0)
			{
				console.log("no fav scenario");
				res.render("fav_scenario",{display_name : res.locals.display_name, data : 0, year: year, subject : subject,scenario_name : 0});
			}
			else
			{
				console.log(result1);
				result = db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND scenario_no = ?",[req.user.user_id,result1[0].scenario_no]);
				{
					if(err)
					{
						console.log("Error while retreiving scenario info "+ err);
					}
					else
					{
						//console.log(result);
						res.render("fav_scenario",{display_name : res.locals.display_name, data : result, year: year, subject : subject,scenario_name : result1});
					}
				};
			}			
		}
	};
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
		
		res.redirect("/signup");
	}

	
}

app.get("/download_scenario",function(req,res)
{
	console.log("req.params : "+JSON.stringify(req.body));

	/*var pdf = "http://localhost:3000/home";

	var options = {
    directory: "./Desktop/HS",
    filename: "2014-11-7.pdf"
	}
 
	download(pdf, options, function(err)
	{
    	if(err) throw err;
    	console.log("meow");
    	
	})*/ 

	res.redirect("/home");
})

app.listen(3000,function()
{
	console.log("listen to port 3000");
});


app.get("/allSubjectsFirstYear",function(req,res)
{
	var err = null;
	result = db.query("SELECT `COURSE_ID`,`NAME`,`SUBJECT`,`MANDATORY` FROM `subjects` WHERE `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT IN ('ENGLISH','HISTORY','MATHS')");
	{
		if(err)
		{
			console.log("Error while retreiving MANDATORY year 9 mandatory subject : "+ err);
		}
		else
		{
			res.send(result);
		}
	}
});


app.get("/GetAllCourses2",function(req,res)
{
	var RecordsForEntireGrid = [];	
	var AvailableSubjects = [];
	var AvailableSubjectsCopy = [];
	var SelectedSubjectID;
	var SelectedSubjectName;
	var InputSelectedSubjectID;
	var iSELECTEDSCORE;
	var InputSelectedSubjectName;
	var ListOfAllSelected = [];
	var iAlreadyAdded =false;
	var result =[];
	var resultset2 =[];
	var iDoNotAddAsPriorCourse = "NO";
	var iYear=0;
	var result_scores = ['A','B','C','D/F'];
	
	//var temp = JSON.stringify(req.query.arrayOfAllGridInfo);
	
	//console.log("result is : "+JSON.stringify(req.query.arrayOfAllGridInfo));
	//console.log("result is 11: "+req.query.arrayOfAllGridInfo.length);
	//console.log("result is 1121212: "+temp);
	//console.log("result is 2312: "+temp.length);
	//console.log(subjects_master);
	console.time('1001-elements');
	for(let i=0;i<req.query.arrayOfAllGridInfo.length;i++)	{
			

			if (i % subjects_master.length == 0 ) 
			{
				iYear = iYear + 1;
			}				
			//console.log(iYear);
			
			//first select all the courses which are eligible for this grade and do not require any pre-req.
			if(iYear==1)
			{		
				console.time('100-1');
				result = db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM subjects WHERE SCHOOL_ID = ? AND replace(replace(SUBJECT,' ',''),'.','') = ? AND LGRADE <= ? AND HGRADE >= ?",[ischool_id,req.query.arrayOfAllGridInfo[i].SUBJECT,req.query.arrayOfAllGridInfo[i].GRADE,req.query.arrayOfAllGridInfo[i].GRADE]);
				console.timeEnd('100-1');
				//console.log("result is : "+JSON.stringify(result));
			}
			else
			{
				console.time('100-2');
				result = db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM subjects WHERE SCHOOL_ID = ? AND replace(replace(SUBJECT,' ',''),'.','') = ? AND LGRADE <= ? AND HGRADE >= ? AND (COURSE_ID NOT IN (SELECT DISTINCT IFNULL(CORE,'-100') FROM prerequisites  WHERE REQ = 'COURSE_PREREQUISITES'))",[ischool_id,req.query.arrayOfAllGridInfo[i].SUBJECT,req.query.arrayOfAllGridInfo[i].GRADE,req.query.arrayOfAllGridInfo[i].GRADE]);
				console.timeEnd('100-2');
			}			
			
			//console.log("result is : "+JSON.stringify(result));
							
				AvailableSubjects = [];
				AvailableSubjectsCopy =[];
				SelectedSubjectID = null;
				SelectedSubjectName = null;
				
				if (req.query.arrayOfAllGridInfo[i].SelectedSubjectID != null)
				{
					InputSelectedSubjectID = req.query.arrayOfAllGridInfo[i].SelectedSubjectID	;
					//console.log(InputSelectedSubjectID);
				}				
				
				
					//console.log("result is : "+JSON.stringify(result));
					//console.log("Query for Subject: " + req.query.arrayOfAllGridInfo[i].SUBJECT + " Year: " + req.query.arrayOfAllGridInfo[i].GRADE + " SELECTED: " + req.query.arrayOfAllGridInfo[i].SELECTED);
					//custom_print (result);
					
					for(var j=0;j<result.length;j++)
					{
						//console.time('100-3');
						//fetch all the score requirements for this course if it's a pre-req for other courses.
						//result_scores = db.query("SELECT DISTINCT GRADE_REQUIRED FROM prerequisites WHERE REQ = 'COURSE_PREREQUISITES' AND SCHOOL_ID = ? AND COURSE = ? UNION SELECT 'D/F' FROM DUAL ORDER BY GRADE_REQUIRED ",[ischool_id,result[j].COURSE_ID]);	
						//console.timeEnd('100-3');						
						
						
						if(result[j].MANDATORY == 'YES')
						{
							SelectedSubjectName = result[j].NAME;			
							SelectedSubjectID = result[j].COURSE_ID;								
							iSELECTEDSCORE = "NA";
							AvailableSubjects = [];
							break;
						}
						if(result[j].COURSE_ID != 0)
						{
							for(var is=0;is<result_scores.length;is++)
							{
								if(result[j].COURSE_ID + result_scores[is] == InputSelectedSubjectID)
								{
									SelectedSubjectName = result[j].NAME;
									SelectedSubjectID = result[j].COURSE_ID;		
									iSELECTEDSCORE = result_scores[is]								
								}
								else
								{	
									AvailableSubjects.push(
										{	SUBTRACK_ID : result[j].COURSE_ID,
											SUBTRACK_NAME : result[j].NAME,
											SUBTRACK_SCORE : result_scores[is]
										})	;
								}
							}
						}
						else
						{
							if(result[j].COURSE_ID + 'NA' == InputSelectedSubjectID)
								{
									SelectedSubjectName = result[j].NAME;
									SelectedSubjectID = result[j].COURSE_ID;		
									iSELECTEDSCORE = 'NA'								
								}
								else
								{	
									AvailableSubjects.push(
										{	SUBTRACK_ID : result[j].COURSE_ID,
											SUBTRACK_NAME : result[j].NAME,
											SUBTRACK_SCORE : 'NA'
										})	;
								}
						}
												
							
					}
					
					if(SelectedSubjectID != null) {
						//console.log("Backend Final Array is 1: "+ req.query.arrayOfAllGridInfo[i].GRADE + req.query.arrayOfAllGridInfo[i].SUBJECT + SelectedSubjectID + SelectedSubjectName);
						ListOfAllSelected.push(
						{						
							GRADE : req.query.arrayOfAllGridInfo[i].GRADE,
							SUBJECT : req.query.arrayOfAllGridInfo[i].SUBJECT,						
							SELECTEDID : SelectedSubjectID,
							SELECTEDSCORE : iSELECTEDSCORE
						});
					}
						//console.log("Backend Final Array is 2: "+ ListOfAllSelected.length);
						
						RecordsForEntireGrid.push(
						{						
							GRADE : req.query.arrayOfAllGridInfo[i].GRADE,
							SUBJECT : req.query.arrayOfAllGridInfo[i].SUBJECT,						
							SELECTEDID : SelectedSubjectID,
							SELECTEDNAME : SelectedSubjectName,
							SELECTEDSCORE : iSELECTEDSCORE,
							AVAILABLECOURSES : 	AvailableSubjects							
						});
			
				
	}
	

	
	console.timeEnd('1001-elements');
		//console.log("result is : "+JSON.stringify(RecordsForEntireGrid));
		res.send(RecordsForEntireGrid);
		return;
		
});


function get_prior_courses(school_id,subject_id)
{
	prior_courses = db.query("SELECT COURSE FROM prerequisites WHERE SCHOOL_ID = ? AND CORE = ?",[ischool_id,SelectedSubjectID]);
	for(let j=0;j<myincomingarray.length;j++)
	{
		console.log("result is : "+ JSON.stringify(myincomingarray[j])) ;	
	}

}