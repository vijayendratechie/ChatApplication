//var log4js = require('log4js');
const myModule = require('SQLike');


var express = require("express");
var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var bodyparser = require("body-parser");
var download = require("download-pdf");



var session = require("express-session");
var passport = require("passport");
var localStrategy = require("passport-local").Strategy;
var mySqlStore = require("express-mysql-session")(session);


var flash = require("connect-flash");

var app = express();


var ListOfAllSelected=[];
var ischool_id = 323;
var years_master = [];
var subjects_master = [];
var DBSubjects = [];
var DBPreReq = [];
var pCourseIDs = [];
var pCourseIDsCopy = [];

var result_scores = [
				['A',5],
				['B',4],
				['C',3],
				['D/F',1]
			];


app.set("views", path.join(__dirname, "views"));
app.set("view engine","ejs");

//This creates a Session table in database to store established user session
var options = {
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'courses_db'
};

var mySessionStore = new mySqlStore(options);

app.use(bodyparser());
app.use(express.static(path.join(__dirname,"static")));

/*log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/runfile.log', category: 'runfile' }
  ]
});

var run_log_file = log4js.getLogger('runfile'); 
 */

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
		console.log(username + " " + password);
		
		db.query("SELECT id AS user_id from student WHERE email = ?",[username],function(err,result,fields)
		{
			if(err)
			{
				console.log("Error while retreiving id: " + err)
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
					db.query("SELECT password from student WHERE email = ?",[username],function(err,result1,fields)
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
					});
				}
			}
		});
		//display error message if not successfully logged in pending
	}		
));


// Db connection
var db = mysql.createConnection(
{
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'courses_db'
});


db.connect(function(err)
{
	if(err)
	{
		console.log("database connection failed");
	}
	else
	{
		console.log("database connection established");
	}
})


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
	db.query("SELECT id,name FROM district",function(err,result,fields)
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
	});
});

app.post("/signup",function(req,res)
{
	if(req.body.flag == 1)
	{
		
		var district = req.body.district;
		
		console.log("\ndistrict: " + district);
		
		db.query("SELECT id,name FROM school WHERE district_id = ?",[district],function(err,result,fields)
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
		}); 	
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

		//check display_name and user already exists in db using ajax before submitting form.

		db.query('INSERT INTO student(display_name,password,email,first_name,last_name,yob,school_id,grade) VALUES (?,?,?,?,?,?,?,?)',[display_name,password,email,first_name,last_name,yob,school_id,grade],
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

					const user_id = result[0];
					console.log("last inserted user " + JSON.stringify(user_id));
					req.login(user_id,function(err)
					{
						res.redirect("/home");
					})
								
								
				});	
			}
						
		});
		}
});



app.get("/profile",authenticationMiddleware(),function(req,res)
{
	var id = req.user.user_id;
	
	var query = "SELECT st.display_name, st.email, st.first_name, st.last_name,st.yob,st.grade, d.id AS district_id, d.name AS district_name, sc.id AS school_id, sc.name AS school_name FROM student AS st,school AS sc,district AS d WHERE st.school_id = sc.id AND sc.district_id = d.id AND st.id = ?"
	db.query(query, [id],function(err,result,fields)
	{
		if(err)
		{
			console.log("\n Error while retreiving user profile info " + err);
		}
		else
		{
			db.query("SELECT id,name FROM district WHERE id != ?",[result[0].district_id],function(err,result1,fields)
			{
				
				var district = result1;

				//console.log("\nstudent_info is " + JSON.stringify(result[0]));
				//console.log("\ndistrict_info is " + JSON.stringify(district));
				res.render("profile",{message : result[0] , district : district});
			})
		}
	});	
	
	//res.redirect("/jugaad/profile/" + req.user.user_id);
})


/*Use this dynamic route in future for each user. Error to correct - Css content not applied to profile view when rendered 
through dynamic route, but gets applied when rendered directly in profile route

app.get("/jugaad/profile/:id",function(req,res)
{
	res.render("profile");
});
*/

function custom_console_print(json_object)
{
	console.log("Output is:"+JSON.stringify(json_object, null, 4));
	//run_log_file.warn("Output is:"+JSON.stringify(json_object, null, 4)); 
}


app.get("/GetSubjectsFromDB",function()
{
	db.query("SELECT COURSE_ID,NAME,replace(replace(SUBJECT,' ',''),'.','') as SUBJECT,DURATION,SEASON,SEX,CREDIT,MANDATORY,ELECTIVE,REPEATABLE, `TYPE (A-G)` as TYPE, LGRADE, HGRADE, REC_GRADE,`LEVEL (REG/HONORS/AP)` as LEVEL , AUDITION_REQ, `ADDITIONAL REG` AS ADD_REQ, DIFFICULTY, POPULARITY, OUTSIDE_ALLOWED, UNITS, MUST_COMP_BY_GRADE, SKIP_ALLOWED FROM COURSES WHERE school_id = ?",[ischool_id],function(err,result)
		{
			
			if(err)
		{
			console.log("\nError while fetching subjects info " + err);
		}
		else
		{
			//console.log("result "+JSON.stringify(result));
			//custom_console_print(result);
			DBSubjects = result;
			//console.log("result "+JSON.stringify(DBSubjects));
			//res.send();
		}
	
		})
});


app.get("/GetPreReqFromDB",function()
{
	db.query("SELECT REQ,REQ_ID,SUB_REQ_ID,MASTER_CONDITION,PASSED,REQ_CONDITION,IFNULL(TGT_COURSE,'NONE') as TGT_COURSE, IFNULL(SRC_COURSE,'NONE') as SRC_COURSE ,CATEGORY,YEARS,CREDITS,IFNULL(GRADE_REQUIRED,'NONE') AS REQ_SCORE,RECOMMENDATION as RECO_REQ FROM prerequisites WHERE school_id = ?",[ischool_id],function(err,result)
		{
			
			if(err)
		{
			console.log("\nError while fetching pre-reqs info " + err);
		}
		else
		{
			//console.log("result "+JSON.stringify(result));
			DBPreReq = result;
		}
	});
});


app.get("/district-school",function(req,res)
{
	//console.log("hi");
	var district_id = req.query.district;
	//console.log(district_id);
	db.query("SELECT id,name FROM school WHERE district_id = ?",[district_id],
		function(err,result,fields)
		{
			//console.log("result "+JSON.stringify(result));
			res.send(result);
		})
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

	db.query(sql,[display_name,email,first_name,last_name,year,hs,grade,id],function(err,result,fields)
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

//remove space or dot from the input string (eg Lab. Science -> LabScience)
function Custom_Trim(str) {
	str = str.toString().replace(/\./g,' ');
    return str.toString().replace(/\s+/g,'');
}

subjects_master = [];
db.query("SELECT * FROM tracks where school_id = ? and track_id ='Mathematics' order by track_seq LIMIT 1 ",[ischool_id],function(err,result)
{
	if(err)
	{
		console.log("Error while retreiving subjects " + err);
	}
	else
	{
		//console.log(resultsetA);
		subjects_master = result; // DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
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
	}
});


var years_master = [];
db.query("SELECT * FROM years where SCHOOL_ID = ? order by year_seq",[ischool_id],function(err,result)
{
	//console.log("012:"+JSON.stringify(result));
	if(err)
	{
		console.log("Error while retreiving subjects " + err);
	}
	else
	{
		//console.log(result);
		years_master = result; // DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
		year =[];
		for(var j=0;j<years_master.length;j++)
		{
			var str = years_master[j].YEAR_ID;
			var str = Custom_Trim(str);
			//console.log("y1:"+str);
			year.push(
			{						
				YEAR : str
			});
		}
	}
});


app.get("/home",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	//console.log(subject);
	var display_name;
	db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id],function(err,result)
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
	});
},function(req,res)
{
	db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND status != 'delete'",[req.user.user_id],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving scenario info : "+err);
		}
		else
		{
			db.query("SELECT scenario_name,fav,status FROM scenario_name WHERE student_id = ? AND status != 'delete'",[req.user.user_id],function(err,result1)
			{
				if(err)
				{
					console.log("Error while retreiving scenario_name "+ err);
				}
				else
				{
					//console.log(result);
					res.render("home",{display_name : res.locals.display_name, data : result, year: year, subject : subject,scenario_name : result1});
				}
			});			
		}
	});	 	
});

app.get("/sent_fav_flag",function(req,res)
{
	//console.log(req.query.scenario_name + " " + req.query.fav_flag);
	if(req.query.fav_flag == 0)
	{
		db.query("UPDATE scenario_name SET fav = 0 WHERE scenario_name = ? AND	student_id	= ?",[req.query.scenario_name,req.user.user_id],function(err)
		{
			if(err)
			{
				console.log("error while updating fav scenario " + err);
			}
			else
			{
				res.send(false);			
			}
		});	
	}
	else if(req.query.fav_flag == 1)
	{
		db.query("SELECT scenario_name FROM scenario_name WHERE fav = 1 AND student_id = ? AND status != 'delete'",[req.user.user_id],function(err,result1)
		{
			if(err)
			{
				console.log("Error while retreiving fav flag " + err);
			}
			else
			{
				//console.log("result1 is "+ JSON.stringify(result1));
				if(result1.length == 0)
				{
					db.query("UPDATE scenario_name SET fav=1 WHERE scenario_name = ? AND student_id = ? AND status != 'delete'",[req.query.scenario_name,req.user.user_id],function(err)
					{
						if(err)
						{
							console.log("error while updating fav scenario to 1 " + err);
						}
						else
						{
							db.query("UPDATE scenario_name SET fav=0 WHERE scenario_name != ? AND student_id = ? AND status!= 'delete'",[req.query.scenario_name,req.user.user_id],function(err)
							{
								if(err)
								{
									console.log("error while updating fav scenario to 0" + err);			
								}
								else
								{
									res.send(false);		
								}
							});										
						}
					});	
				}
				else
				{
					db.query("UPDATE scenario_name SET fav=1 WHERE scenario_name = ? AND student_id = ? AND status != 'delete'",[req.query.scenario_name,req.user.user_id],function(err)
					{
						if(err)
						{
							console.log("error while updating fav scenario to 1 " + err);
						}
						else
						{
							db.query("UPDATE scenario_name SET fav=0 WHERE scenario_name != ? AND student_id = ? AND status != 'delete'",[req.query.scenario_name,req.user.user_id],function(err)
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
							});										
						}
					});	
				}				
			}
		});		
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


	db.query("SELECT * FROM subjects",function(err,result)
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
	});
	//res.send(sub);
});

app.get("/get_year",authenticationMiddleware(),function(req,res)
{
	
	/*years_master = [];
	setTimeout(function()
	{
		db.query("SELECT * FROM years where SCHOOL_ID = ? order by year_seq",['323'],function(err,result)		
	{
		console.log("0001:"+JSON.stringify(result));
		if(err)
		{
			console.log("Error while retreiving subjects " + err);
		}
		else
		{
			//console.log(result);
			years_master = result; // DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
		}
		});
			},1000);
		console.log("0002:"+JSON.stringify(years_master));

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
		//console.log(year);*/

	
	res.send(year);
})

app.get("/get_distinct_subjects",authenticationMiddleware(),function(req,res)
{
	res.send(subject);
})

//Not in use
app.get("/y9_sENGLISH",function(req,res)
{
	
	db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM `subjects` WHERE `MANDATORY` = 'yes' AND `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT = 'ENGLISH'",function(err,result)
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
				db.query("SELECT `COURSE_ID`,`NAME` FROM `subjects` WHERE `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT = 'ENGLISH'",function(err,result)
				{
					if(err)
					{
						console.log("Error while retreiving year 9 English data: "+err);
					}
					else
					{
						res.send(result);
					}
				})
			}
		}
	})
});

app.get("/allSubjectsFirstYear",function(req,res)
{
	
	db.query("SELECT `COURSE_ID`,`NAME`,`SUBJECT`,`MANDATORY` FROM `subjects` WHERE `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT IN ('ENGLISH','HISTORY','MATHS')",function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving MANDATORY year 9 mandatory subject : "+ err);
		}
		else
		{
			res.send(result);
		}
	})
});

//maths first year
app.get("/firstYear",function(req,res)
{
	
	db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM `subjects` WHERE `MANDATORY` = 'yes' AND `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT = ?",[req.query.subject],function(err,result)
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
				db.query("SELECT `COURSE_ID`,`NAME` FROM `subjects` WHERE `LGRADE` <= 9 AND `HGRADE` >= 9 AND SUBJECT = 'MATHS'",function(err,result)
				{
					if(err)
					{
						console.log("Error while retreiving year 9 MATHS data: "+err);
					}
					else
					{
						res.send(result);
					}
				})
			}
		}
	})
});

app.get("/toFillDataInCell",function(req,res)
{
	console.log("info to fill 11 dropdown " + JSON.stringify(req.query));
  	var arr = [];
  	var selected_course_id_arr = [];
  	var pre_req_subjects_arr = [];

  	//check for mandet subjects here if no mandet then call the below with function call

  	db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM `subjects` WHERE `MANDATORY` = 'yes' AND `LGRADE` <= ? AND `HGRADE` >= ? AND SUBJECT = ?",[req.query.grade,req.query.grade,req.query.subject],function(err,result)
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
				db.query("SELECT `COURSE_ID` FROM `subjects` WHERE NAME IN (?)",[req.query.data],function(err,result)
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
			  			db.query("SELECT DISTINCT `COURSE` FROM `PREREQUISITES` WHERE `REQ` = 'COURSE_PREREQUISITES' AND `CORE` IN (?)",[selected_course_id_arr],function(err,result)
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

								    db.query("SELECT DISTINCT `COURSE` FROM `PREREQUISITES` WHERE `REQ` = 'COURSE_PREREQUISITES' AND `CORE` = ?",[pre_req_subjects_arr[j]],function(err,preOfPreReq) 
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
								    })                 
								})(0);
							}
						})
			  		}
			  	})			
			}
		}
	})
  	 
  	function subjectToDisplay()
  	{
  		var sqlQuery;
  		if(pre_req_subjects_arr.length == 0)
  		{
  			sqlQuery = "SELECT COURSE_ID,NAME,SUBJECT FROM subjects WHERE LGRADE <= ? AND HGRADE >= ? AND NAME NOT IN (?)"; 
  		}
  		else
  		{
  			sqlQuery = "SELECT COURSE_ID,NAME,SUBJECT FROM subjects WHERE LGRADE <= ? AND HGRADE >= ? AND NAME NOT IN (?) AND COURSE_ID NOT IN (?)";
  		}		

  		
		db.query(sqlQuery,[req.query.grade,req.query.grade,req.query.data,pre_req_subjects_arr],function(err,y10_sub)
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
					db.query("SELECT p.`REQ_CONDITION`,p.`COURSE`,s.`SUBJECT` FROM `PREREQUISITES` AS p,`SUBJECTS` AS s WHERE p.`CORE` = s.`COURSE_ID` AND `REQ` = 'COURSE_PREREQUISITES' AND `CORE` = ?",[y10_sub[i].COURSE_ID],function(err,pre_req)
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

					})					
				}
			}						
		})
	}	
});


function myprint(myincomingarray)
{
	//console.clear() ;
	console.log("result is : "+ myincomingarray.length) ;	
	for(let j=0;j<myincomingarray.length;j++)
	{
		console.log("result is : "+ JSON.stringify(myincomingarray[j])) ;	
	}

}


app.post("/all_grid_info",function(req,res)
{
	var subtrackForAllGrid = [];
	var subtrack = [];
	var selected;
	var MandatoryFlag;
		
	for(let i=0;i<req.body.arrayOfAllGridInfo.length;i++)
	{
		MandatoryFlag = 'NO';
		subtrack = null;

		if(req.body.arrayOfAllGridInfo[i].SELECTED == "")
		{
			//console.log("subject : " + req.body.arrayOfAllGridInfo[i].SUBJECT+"grade : "+req.body.arrayOfAllGridInfo[i].GRADE)
			
			//remove this and settimeoout
			//if(req.body.arrayOfAllGridInfo[i].SUBJECT == 'ENGLISH' && req.body.arrayOfAllGridInfo[i].GRADE == 9)
			//{
			db.query("SELECT `COURSE_ID`,`NAME`,`MANDATORY` FROM subjects WHERE SUBJECT = ? AND LGRADE <= ? AND HGRADE >= ?",[req.body.arrayOfAllGridInfo[i].SUBJECT,req.body.arrayOfAllGridInfo[i].GRADE,req.body.arrayOfAllGridInfo[i].GRADE],function(err,result)
			{
				if(err)
				{
					console.log("Error while retreiving courses of all grid with no value selected " + err);
				}
				else
				{
					//console.log("result is : "+JSON.stringify(result));
					console.log("Query for Subject: " + req.body.arrayOfAllGridInfo[i].SUBJECT + " Year: " + req.body.arrayOfAllGridInfo[i].GRADE + " SELECTED: " + req.body.arrayOfAllGridInfo[i].SELECTED);
					myprint (result);
					
					for(var j=0;j<result.length;j++)
					{
						if(result[j].MANDATORY == 'YES')
						{
							selected = result[j].NAME;							
							MandatoryFlag = 'YES';
							subtrackForAllGrid.push(
							{						
								GRADE : req.body.arrayOfAllGridInfo[i].GRADE,
								SUBJECT : req.body.arrayOfAllGridInfo[i].SUBJECT,						
								SELECTED : selected,
								SUBTRACK : {}
							})

						}						
					}
					if( MandatoryFlag == 'NO' )
					{
						console.log("i am here ");
						subtrack = null;
						for(var j=0;j<result.length;j++)
						{
							subtrack.push(
							{	COURSE_ID : result[j].COURSE_ID,
								COURSE_NAME : result[j].NAME
							})
						}

						subtrackForAllGrid.push(
						{						
							GRADE : req.body.arrayOfAllGridInfo[i].GRADE,
							SUBJECT : req.body.arrayOfAllGridInfo[i].SUBJECT,						
							SELECTED : req.body.arrayOfAllGridInfo[i].SELECTED,
							//SUBTRACK : subtrack
						})						
					}
				}
			})
			//}
		}
	}


	setTimeout(function()
	{
		console.log("FINAL OUTPUT");
		console.log("Backend Final Array is : "+ JSON.stringify(subtrackForAllGrid));
	},1000);
	
	res.send();

	//console.log("all grid info : "+JSON.stringify(req.query));
})


app.get("/scenario_name",authenticationMiddleware(),function(req,res)
{
	var scenario_name =	req.query.scenario_name;
	var flag = 0;
	//console.log(scenario_name);

	db.query("SELECT scenario_name FROM scenario_name WHERE student_id=? AND status='save'",[req.user.user_id],function(err,result)
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
	});
});


app.post("/create",authenticationMiddleware(),function(req,res)
{
	var status = req.body.status;
	var scenario_name = req.body.scenario_name;
	var j=0;
		
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

	db.query("SELECT `scenario_no` FROM scenario WHERE `student_id` = ? ORDER BY `scenario_no` DESC LIMIT 1",[req.user.user_id],function(err,result1)
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
				db.query(insert_query,[req.user.user_id,next_scenario_no,status,grade_course[i].grade,grade_course[i].course_id],function(err,result2)
				{
					if(err)
					{
						console.log("Error while inserting data " + err);
						res.redirect("/create");
					}
				});
			}

			db.query("INSERT INTO scenario_name(`student_id`, `scenario_no`, `status`,`scenario_name`) VALUES (?,?,?,?)",[req.user.user_id,next_scenario_no,status,scenario_name],function(err,result3)
			{
				if(err)
				{
					console.log("Error while inserting scenario_name " + err);
				}
			});
				
				// redirecting outside the above query will create a problem when result not inserted in db
			res.redirect("/home");
		}
	});
});


app.post("/delete",authenticationMiddleware(),function(req,res)
{
	var scenario_no = req.body.delete;
	var page_name = req.body.page_name;
	console.log("scenario_no "+ scenario_no);
	db.query("UPDATE scenario SET status='delete' WHERE student_id = ? AND scenario_no = ?",[req.user.user_id,scenario_no],function(err,result)
	{
		if(err)
		{
			console.log("Error while updating delete status: " + err);
		}		
	});	

	db.query("UPDATE scenario_name SET status='delete' WHERE student_id = ? AND scenario_no = ?",[req.user.user_id,scenario_no],function(err,result)
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
	});
});

app.get("/save",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	var display_name;
	db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id],function(err,result)
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
	});
},function(req,res)
{
	db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND status = 'save'",[req.user.user_id],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving scenario info : "+err);
		}
		else
		{
			db.query("SELECT scenario_name FROM scenario_name WHERE student_id = ? AND status = 'save'",[req.user.user_id],function(err,result1)
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
			});			
		}
	});
});

app.get("/draft",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	var display_name;
	db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id],function(err,result)
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
	});
},function(req,res)
{
	db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND status = 'draft'",[req.user.user_id],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving scenario info : "+err);
		}
		else
		{
			db.query("SELECT scenario_name FROM scenario_name WHERE student_id = ? AND status = 'draft'",[req.user.user_id],function(err,result1)
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
			});			
		}
	});
});

app.get("/search",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	var display_name;
	db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id],function(err,result)
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
	});
},function(req,res)
{
	var search_name = req.query.search_name;
	db.query("SELECT scenario_no,scenario_name FROM scenario_name WHERE student_id = ? AND scenario_name = ?",[req.user.user_id,search_name],function(err,result2)
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
				db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND scenario_no=?",[req.user.user_id,result2[0].scenario_no],function(err,result)
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
				});
			}
		}
	});	
});

app.get("/fav_scenario",authenticationMiddleware(),function(req,res,next)
{
	console.log("\nUser id is: "+ JSON.stringify(req.user));
	console.log("Is user authenticated: "+req.isAuthenticated());
	
	var display_name;
	db.query("SELECT display_name FROM student WHERE id=?",[req.user.user_id],function(err,result)
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
	});
},function(req,res)
{
	db.query("SELECT scenario_name,scenario_no FROM scenario_name WHERE student_id = ? AND fav = 1 AND status != 'delete'",[req.user.user_id],function(err,result1)
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
				db.query("SELECT scenario_no, grade, course_id FROM scenario WHERE student_id = ? AND scenario_no = ?",[req.user.user_id,result1[0].scenario_no],function(err,result)
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
				});
			}			
		}
	});
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

//Get Score Numeric Value
function GetScoreValue(iScore)
{
	for(let i=0;i<result_scores.length;i++)	
	{
		if(result_scores[i][0] == iScore)
		{
			return result_scores[i][1];
		}
	}
	
	return 0;
}



//Validate this courses and if meets the requirement, retusn VALID flag if so
function IsThisCourseValid(iCurrentCourseID,SelectedCourseIDs,SelectedCourseScores) 
{
	//console.log(iCurrentCourseID);
	//find if this course is repeat allowed
	CurrentCourse = [];
	NoOfPreReq =[];
	NoOfSubPreReq =[];
	var iReq_id= null;
	
	CurrentCourse = SQLike.q({
			Select: ['*'],
		   From: DBSubjects ,
			Where: function(){return (this.COURSE_ID == iCurrentCourseID)}
	   });
	//custom_console_print(CurrentCourse);
	//REQ,REQ_ID,SUB_REQ_ID,MASTER_CONDITION,PASSED,REQ_CONDITION,TGT_COURSE, SRC_COURSE,CATEGORY,YEARS,CREDITS,GRADE_REQUIRED AS REQ_SCORE,RECOMMENDATION as RECO_REQ	
	  PreReqForCourse = SQLike.q({
			Select: ['*'],
		   From: DBPreReq ,
			Where: function(){return (this.TGT_COURSE == iCurrentCourseID) && (this.REQ=='COURSE_PREREQUISITES')},
			OrderBy: ['REQ_ID','SUB_REQ_ID']			
	   });
	//custom_console_print(PreReqForCourse);
	//custom_console_print(SelectedCourseIDs);
	for(let i=0;i<SelectedCourseIDs.length;i++)	
	{
		//custom_console_print(SelectedCourseIDs[i] + iCurrentCourseID);
		if(SelectedCourseIDs[i] == iCurrentCourseID)
		{				
			if(CurrentCourse.REPEATABLE != 'YES')
			{
				return false;
			}
		}
	}
		
	iReq_id = null;
	iMasterCondition = [];	
	//find out if this course has pre-reqs and process if so
	
	for(let i=0;i<PreReqForCourse.length;i++)	
	{		
		iMasterCondition.push(PreReqForCourse[i].MASTER_CONDITION);
		iMasterCondition[i] = iMasterCondition[i].split('OR').join(' || ');	//2210A 2230B Output is:"true OR 2"
		iMasterCondition[i] = iMasterCondition[i].split('AND').join(' && ');	
		for(let j=0;j<SelectedCourseIDs.length;j++)	
		{			
			//console.log(GetScoreValue(SelectedCourseScores[j]) + SelectedCourseScores[j]);
			//console.log(GetScoreValue(PreReqForCourse[i].REQ_SCORE) + PreReqForCourse[i].REQ_SCORE);
			//custom_console_print(PreReqForCourse[i].SRC_COURSE +SelectedCourseIDs[j] + SelectedCourseScores[j] + PreReqForCourse[i].REQ_SCORE);
			if((PreReqForCourse[i].SRC_COURSE == SelectedCourseIDs[j]) && (GetScoreValue(SelectedCourseScores[j]) >= GetScoreValue(PreReqForCourse[i].REQ_SCORE)))
			{
				console.log(GetScoreValue(SelectedCourseScores[j]) + SelectedCourseScores[j]);
				console.log(GetScoreValue(PreReqForCourse[i].REQ_SCORE) + PreReqForCourse[i].REQ_SCORE);
		
				//custom_console_print(PreReqForCourse[i]);
				//custom_console_print(iMasterCondition);
				
				// This specific sub req is passed, let's update the array master condition column
				iMasterCondition[i] = iMasterCondition[i].replace (PreReqForCourse[i].SUB_REQ_ID, 'true');	
				//custom_console_print(PreReqForCourse[i].SRC_COURSE +SelectedCourseIDs[j] + SelectedCourseScores[j] + PreReqForCourse[i].REQ_SCORE + iMasterCondition[i] );
				//custom_console_print(iMasterCondition);
			}
		}
	}
	
	pCourseIDs = [];
	pCourseIDsCopy = [];
	//Is this course lower than already selected course (direct or cascade down)	
	for(let j=0;j<SelectedCourseIDs.length;j++)	
	{
		PreReqForCourse = SQLike.q({
				SelectDistinct: ['SRC_COURSE'],
			   From: DBPreReq ,
				Where: function(){return (this.TGT_COURSE == SelectedCourseIDs[j]) && (this.REQ=='COURSE_PREREQUISITES')}
		   });
		// need to check for selected bu invalid also
		for(let k=0;k<PreReqForCourse.length;k++)	
		{
			custom_console_print("hey:" + SelectedCourseIDs[j] + iCurrentCourseID + PreReqForCourse[k].SRC_COURSE + PreReqForCourse.length);
			pCourseIDs.push(PreReqForCourse[k].SRC_COURSE);
			pCourseIDsCopy.push(PreReqForCourse[k].SRC_COURSE);			
			custom_console_print(pCourseIDs);
			while(pCourseIDs.length > 0)
			{
				GetPriorCourses(PreReqForCourse[k].SRC_COURSE);
				pCourseIDs.splice(PreReqForCourse[k].SRC_COURSE);
			}
		}
		
	}
	for(let j=0;j<pCourseIDsCopy.length;j++)	
	{
		if(pCourseIDsCopy[j] == iCurrentCourseID)
		{
			return false;
		}
	}
	
	
	var isValid = 'NO';
	for(let i=0;i<iMasterCondition.length;i++)	
	{		
		for (let j=0;j<25;j++)
		{
			iMasterCondition[i] = iMasterCondition[i].split(j).join(' false ');
		}
		//custom_console_print(iCurrentCourseID + iMasterCondition[i]);
		if (eval(iMasterCondition[i]) == true) 
		{
			custom_console_print("1"+iCurrentCourseID + iMasterCondition[i]);
			//custom_console_print(iMasterCondition[i]);
			isValid = 'YES';
			break;			
		}
	}
	if(isValid == 'NO' && iMasterCondition.length > 0 )
	{
		return false;
	}

	return true;
}

function GetPriorCourses(iPrior)
{
	PreReqForCourse2 = SQLike.q({
				SelectDistinct: ['SRC_COURSE'],
			   From: DBPreReq ,
				Where: function(){return (this.TGT_COURSE == iPrior) && (this.REQ=='COURSE_PREREQUISITES')}
	   });
	// need to check for selected bu invalid also
	for(let j=0;j<PreReqForCourse2.length;j++)	
	{
		pCourseIDs.push(PreReqForCourse2[j].SRC_COURSE);
		pCourseIDsCopy.push(PreReqForCourse2[j].SRC_COURSE);			
	}
	for(let j=0;j<pCourseIDs.length;j++)	
	{
		if(pCourseIDs[j] == iPrior)
		{
			pCourseIDs.splice(iPrior);
			return;	
		}
	}
	return;		
}


//Validate all the courses and if meets the requirement, keep VALID flag as 'YES' else change to 'NO' & selected to 'NO' also
function ValidateCourseList(RecordsForEntireGrid) 
{
	var iFirstGrade = year[0].YEAR;
	var SelectedCourseIDs = [];
	var SelectedCourseScores = [];
	
	var iValid = true;
	//console.log("tst:"+iFirstGrade+ListOfAllSelected[0].GRADE);
	
	
	//first collect all the selcted courses
	//validate each selected to be valid and if not mark it invalid
	for(let i=0;i<RecordsForEntireGrid.length;i++)	
	{
		if(iFirstGrade == RecordsForEntireGrid[i].GRADE )
		{
			//skip validations
			for(let j=0;j<RecordsForEntireGrid[i].AVAILABLECOURSES.length;j++)	
			{	
				if(RecordsForEntireGrid[i].AVAILABLECOURSES[j].SELECTED == 'YES' && RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID == 'YES')
				{
					SelectedCourseIDs.push(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID);
					SelectedCourseScores.push(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_SCORE);
				}
			}
		}
		else
		{
			//skip validations
			for(let j=0;j<RecordsForEntireGrid[i].AVAILABLECOURSES.length;j++)	
			{	
				iValid = true;
				iCurrentCourseID = RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID;
				iValid = IsThisCourseValid(iCurrentCourseID,SelectedCourseIDs,SelectedCourseScores);
				//console.log(iCurrentCourseID + RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID);
				if(iValid == false)
				{
					//console.log(iCurrentCourseID);
					RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID = 'NO';
					//break;
				}
				if((RecordsForEntireGrid[i].AVAILABLECOURSES[j].SELECTED == 'YES') && (RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID == 'YES'))
				{
					SelectedCourseIDs.push(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID);
					SelectedCourseScores.push(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_SCORE);					
				}
				//console.log(iCurrentCourseID + RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID);
				
				/*if(RecordsForEntireGrid[i].AVAILABLECOURSES.SELECTED == 'YES' && RecordsForEntireGrid[i].AVAILABLECOURSES.VALID == 'YES')
				{
					
				}*/
				
			}
		}
	
	}
}

app.post("/GetAllCourses",function(req,res)
{
	var RecordsForEntireGrid = [];	
	var AvailableSubjects = [];
	var AvailableSubjectsCopy = [];
	var SelectedSubjectID;
	var SelectedSubjectName;
	var iSELECTEDSCORE;
	var InputSelectedSubjectID;
	var InputSelectedSubjectName;
	var ListOfAllSelected = [];
	var iAlreadyAdded =false
	var result =[];
	var resultset2 =[];
	var iDoNotAddAsPriorCourse = "NO";
	var iYear=0;
	
	var err = null;
		
	var iCounter=0;
	
	//custom_console_print("Frontend Array is : "+ JSON.stringify(req.body.arrayOfAllGridInfo));
	for(let i=0;i<req.body.arrayOfAllGridInfo.length;i++)	
	{
				result =[];
				result = SQLike.q({
						Select: ['*'],
					   From: DBSubjects ,
						Where: function(){return (this.LGRADE <= req.body.arrayOfAllGridInfo[i].GRADE) && (this.HGRADE >= req.body.arrayOfAllGridInfo[i].GRADE) && (this.SUBJECT ==  req.body.arrayOfAllGridInfo[i].SUBJECT)},
						OrderBy: ['COURSE_ID']
				   })
				
				//if(req.body.arrayOfAllGridInfo[i].SUBJECT == 'Mathematics'){
				//	custom_console_print(result);
				//}
				
				AvailableSubjects = [];				

					for(var j=0;j<result.length;j++)
					{						
						iSelected = 'NO';
						if(result[j].MANDATORY == 'YES')
						{
							AvailableSubjects=[];
							AvailableSubjects.push(
							{	COURSE_ID : result[j].COURSE_ID,
								COURSE_NAME : result[j].NAME,
								COURSE_SCORE : 'NA',
								VALID : 'YES',
								MANDATORY : 'YES',
								SELECTED : 'YES'
							})	;
							
							break;
						}
						
						// if placeholder coourse, push it with NA score requirement.
						if(req.body.arrayOfAllGridInfo[i].SelectedSubjectID == result[j].COURSE_ID + ' - NA')
						{
							iSelected = 'YES';
						}
						if(result[j].COURSE_ID == 0)
						{
							AvailableSubjects.push(
							{	COURSE_ID : result[j].COURSE_ID,
								COURSE_NAME : result[j].NAME,
								COURSE_SCORE : 'NA',
								VALID : 'YES',
								MANDATORY : 'NO',
								SELECTED : iSelected
							})	;

						}
						
						//if not an placeholder couse, populate it with all possible scores.
						//console.log("1:"+req.body.arrayOfAllGridInfo[i].SelectedSubjectID  + result[j].COURSE_ID)
						if(result[j].COURSE_ID != 0)
						{
							for(var is=0;is<result_scores.length;is++)
							{
								iSelected = 'NO';
								if(req.body.arrayOfAllGridInfo[i].SelectedSubjectID == result[j].COURSE_ID + result_scores[is][0])
								{
									iSelected = 'YES';
								}
								
								AvailableSubjects.push(
								{	COURSE_ID : result[j].COURSE_ID,
									COURSE_NAME : result[j].NAME,
									COURSE_SCORE : result_scores[is][0],
									VALID : 'YES',
									MANDATORY : 'NO',
									SELECTED : iSelected
								})	;
							}	

						}
					}
	
						RecordsForEntireGrid.push(
						{						
							GRADE : req.body.arrayOfAllGridInfo[i].GRADE,
							SUBJECT : req.body.arrayOfAllGridInfo[i].SUBJECT,													
							AVAILABLECOURSES : 	AvailableSubjects							
						});
	
	}
	
		
		ValidateCourseList(RecordsForEntireGrid);
		//if(req.body.arrayOfAllGridInfo[i].SUBJECT == 'Mathematics')
		{
			//custom_console_print(RecordsForEntireGrid);
		}
	
		//console.log("Backend Final Array is : "+ JSON.stringify(RecordsForEntireGrid));
		res.send(RecordsForEntireGrid);
})


