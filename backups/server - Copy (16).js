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

//var ischool_id = 323;
var years_master = [];
var subjects_master = [];

var DBAllSchoolCourses = [];
var DBAllSchoolPreReq = [];
var DBSchools = [];
//below variable define maximum recrusive dependancy we need to check for prior classes
var iLookBackCount = 5;

//assuming there will be no more than 25 AND and OR conditions for one req id
var iCascadeConditions = 25

//NA Score
var NAScore = 'NA';

var result_scores = [
				['A',5],
				['B',4],
				['C',3],
				['D',2],
				['F',1]
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

//remove space or dot from the input string (eg Lab. Science -> LabScience)
function Custom_Trim(str) {
	str = str.toString().replace(/\./g,' ');
    return str.toString().replace(/\s+/g,'');
}


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
		//console.log(username + " " + password);
		
		db.query("SELECT id AS user_id from student WHERE email = ?",[username],function(err,result,fields)
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
					return done(null,false , {message : "Username does not exists"});
				}
				else
				{
					db.query("SELECT password from student WHERE email = ?",[username],function(err,result1,fields)
					{
						//console.log("db password" + JSON.stringify(result1[0].password));
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
		
		db.query("SELECT id,name FROM school WHERE STATUS = 'ACTIVE' AND district_id = ?",[district],function(err,result,fields)
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

app.get("/district-school",function(req,res)
{
	//console.log("hi");
	var district_id = req.query.district;
	//console.log(district_id);
	db.query("SELECT id,name FROM school WHERE STATUS = 'ACTIVE' AND district_id = ?",[district_id],
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





var years_master = [];
db.query("SELECT distinct id FROM school order by id",function(err,result_school_ids)
{
	if(err)
	{
		console.log("Error while retreiving school ids " + err);
	}			
	else
	{
		for(let j=0;j<result_school_ids.length;j++)
		{
			//console.log(result_school_ids);
			db.query("SELECT YEAR_ID AS YEAR FROM years where SCHOOL_ID = ? order by year_seq",[result_school_ids[j].id],function(err,result)
			{
				//console.log("012:"+JSON.stringify(result));
				//years_master = result;
				if(err)
				{
					console.log("Error while retreiving years " + err);
				}
				else
				{
					//console.log(result);
					if(result != null)
					{
						
						years_master.push(
							{						
								SCHOOL_ID : 	result_school_ids[j].id,											
								YEARS 	  : 	result						
							}); 
						// DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
					}
				}
				
			});
		}
	}
});

function GetYearsForSchool(iSchoolID)
{
	year =[];
	for(let j=0;j<years_master.length;j++)
	{
		if(years_master[j].SCHOOL_ID == iSchoolID)
		{
			//if(years_master[j].SCHOOL_ID == '323'){console.log(years_master);}
			for(let i=0;i<years_master[j].YEARS.length;i++)
			{
				year.push(
				{						
					YEAR : years_master[j].YEARS[i].YEAR
				});
			}
				return year;
		}
	}
	return null;
}

var subjects_master = [];
db.query("SELECT distinct id FROM school order by id",function(err,result_school_ids)
{
	//console.log(result_school_ids);
	if(err)
	{
		console.log("Error while retreiving school ids " + err);
	}			
	else
	{
		for(let j=0;j<result_school_ids.length;j++)
		{
			//good link
			db.query("SELECT DISTINCT TRACK_NAME AS SUBJECT FROM tracks where school_id = ? order by track_seq  ",[result_school_ids[j].id],function(err,result)
			
			//db.query("SELECT DISTINCT TRACK_NAME AS SUBJECT FROM tracks where school_id = ? and track_id = 'Phys. Ed.' order by track_seq  ",[result_school_ids[j].id],function(err,result)
			//small scopes
			//db.query("SELECT DISTINCT TRACK_NAME AS SUBJECT FROM tracks where school_id = ? and track_id = 'Mathematics' order by track_seq  ",[result_school_ids[j].id],function(err,result)
			//db.query("SELECT DISTINCT TRACK_NAME AS SUBJECT FROM tracks where school_id = ? and track_id = 'Mathematics' or track_id = 'Lab. Science' order by track_seq  ",[result_school_ids[j].id],function(err,result)
			//db.query("SELECT DISTINCT TRACK_NAME AS SUBJECT FROM tracks where school_id = ? and track_id = 'History' order by track_seq  ",[result_school_ids[j].id],function(err,result)
			{
				//console.log("012:"+JSON.stringify(result));
				if(err)
				{
					console.log("Error while retreiving tracks " + err);
				}
				else
				{
					if(result != null)
					{
						
						//console.log(result);
						subjects_master.push(
							{						
								SCHOOL_ID : 	result_school_ids[j].id,											
								SUBJECTS  : 	result						
							}); 
							// DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
					}
				}
			});
		}
	}
});

function GetSubjectsForSchool(iSchoolID)
{
	subject =[];
	for(let j=0;j<subjects_master.length;j++)
	{
		if(subjects_master[j].SCHOOL_ID == iSchoolID)
		{
			for(let i=0;i<subjects_master[j].SUBJECTS.length;i++)
			{
				subject.push(
				{						
					SUBJECT : Custom_Trim(subjects_master[j].SUBJECTS[i].SUBJECT)
				});
			}
				return subject;
		}
	}
	return null;
			
}



var DBAllSchoolCourses = [];
db.query("SELECT distinct id FROM school order by id",function(err,result_school_ids)
{
	if(err)
	{
		console.log("Error while retreiving school ids " + err);
	}			
	else
	{
		for(let j=0;j<result_school_ids.length;j++)
		{
			db.query("SELECT COURSE_ID,NAME,replace(replace(t.track_name,' ',''),'.','') as SUBJECT, DURATION,SEASON,SEX,CREDIT,MANDATORY,ELECTIVE,REPEATABLE, `TYPE (A-G)` as TYPE, LGRADE, HGRADE, REC_GRADE,`LEVEL (REG/HONORS/AP)` as LEVEL , AUDITION_REQ, `ADDITIONAL REG` AS ADD_REQ, DIFFICULTY, POPULARITY, OUTSIDE_ALLOWED, UNITS, MUST_COMP_BY_GRADE, SKIP_ALLOWED, ALLOWED FROM COURSES c, tracks t WHERE c.ALLOWED = 'YES' AND c.SCHOOL_ID = t.SCHOOL_ID AND c.subject = t.track_id and c.school_id =?",[result_school_ids[j].id],function(err,result)
			{
				//console.log("012:"+JSON.stringify(result));
				if(err)
				{
					console.log("Error while retreiving all subjects " + err);
				}
				else
				{
					//console.log(result);
					if(result != null)
					{
						DBAllSchoolCourses.push(
							{						
								SCHOOL_ID 		: 	result_school_ids[j].id,											
								DBCourses 	  	: 	result						
							}); 
							// DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
					}	
				}
			});
		}
	}
});

function GetDBCoursesForSchool(iSchoolID)
{

	for(let j=0;j<DBAllSchoolCourses.length;j++)
	{
		if(DBAllSchoolCourses[j].SCHOOL_ID == iSchoolID)
		{	
			//for(let i=0;i<DBAllSchoolCourses[j].DBCourses.length;i++)
			{		
			return DBAllSchoolCourses[j].DBCourses
			}
		}
	}
	return null;
}


var DBAllSchoolPreReq = [];
db.query("SELECT distinct id FROM school order by id",function(err,result_school_ids)
{
	if(err)
	{
		console.log("Error while retreiving school ids " + err);
	}			
	else
	{
		for(let j=0;j<result_school_ids.length;j++)
		{
			db.query("SELECT REQ,REQ_ID,SUB_REQ_ID,MASTER_CONDITION,PASSED,REQ_CONDITION,IFNULL(TGT_COURSE,'NONE') as TGT_COURSE, IFNULL(SRC_COURSE,'NONE') as SRC_COURSE ,CATEGORY,YEARS,CREDITS,IFNULL(GRADE_REQUIRED,'NONE') AS REQ_SCORE,RECOMMENDATION as RECO_REQ FROM prerequisites WHERE school_id = ?",[result_school_ids[j].id],function(err,result)
			{
				//console.log("012:"+JSON.stringify(result));
				if(err)
				{
					console.log("Error while retreiving pre reqs " + err);
				}
				else
				{
					if(result != null)
					{
						//console.log(result);
						DBAllSchoolPreReq.push(
						{						
							SCHOOL_ID 		: 	result_school_ids[j].id,											
							DBPreReq 	  	: 	result						
						}); 
						// DB will return result with small case subject key, be careful while using in conditional statements. Because uppercase lowercase mismatch.
					}
				}
			});
		}
	}
});

function GetDBPreReqForSchool(iSchoolID)
{
	for(let j=0;j<DBAllSchoolPreReq.length;j++)
	{
		if(DBAllSchoolPreReq[j].SCHOOL_ID == iSchoolID)
		{	
			//for(let i=0;i<DBAllSchoolPreReq[j].DBPreReq.length;i++)
			{		
			return DBAllSchoolPreReq[j].DBPreReq
			}
		}
	}
	
	
	return null;
}

var DBSchools = [];
db.query("SELECT * FROM school order by id",function(err,result)
{
	if(err)
	{
		console.log("Error while retreiving school ids " + err);
	}			
	else
	{
		
		//console.log("012:"+JSON.stringify(result));
		if(err)
		{
			console.log("Error while retreiving all subjects " + err);
		}
		else
		{
			//console.log(result);
			if(result != null)
			{
				DBSchools = result;
			}	
		}
	}
});





app.get("/home",authenticationMiddleware(),function(req,res,next)
{
	//console.log("\nUser id is: "+ JSON.stringify(req.user));
	//console.log("Is user authenticated: "+req.isAuthenticated());
	
	//console.log(subject);
	var display_name;
	var school_id;
	db.query("SELECT display_name, school_id FROM student WHERE id=? LIMIT 1",[req.user.user_id],function(err,result)
	{	
		if(err)
		{
			console.log("Error while retreiving display_name");
		}
		else
		{
			display_name = result[0].display_name;
			school_id = result[0].school_id;
			//res.render("home",{display_name : display_name});
			res.locals.display_name = display_name;
			res.locals.school_id = school_id;
			next();
		}
	});
},function(req,res)
{
	year = GetYearsForSchool(res.locals.school_id);
	subject = GetSubjectsForSchool(res.locals.school_id);
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
	
	
	db.query("SELECT `school_id` FROM student WHERE id=? LIMIT 1",[req.user.user_id],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving school_id " + err);
		}
		else
		{
			//console.log("\nUser school id is: "+ JSON.stringify(result));
			
			year = GetYearsForSchool(result[0].school_id);
			subject = GetSubjectsForSchool(result[0].school_id);
			res.render("create_scene",{subject : subject,year: year,school_id : result});
		}
	})
	
	
	/*res.render("create_scenario",{no_of_years : no_of_years, no_of_subjects : no_of_subjects, subject : subject, year: year});*/
});

//NOT IN USE 
app.get("/grade-subject",authenticationMiddleware(),function(req,res)
{
	//sub = [{subject : "history1"},{subject : "history2"}];
	subject = GetSubjectsForSchool(req.iSchool_ID);
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

app.post("/get_cs_link_url",authenticationMiddleware(),function(req,res)
{
	school_id = Custom_Trim(req.body.iSchool_ID);
	DBThisSchool = SQLike.q({
			Select: ['*'],
		   From: DBSchools ,
			Where: function(){return (this.id == school_id) && (this.STATUS=='ACTIVE')}			
	   });
	if(DBThisSchool.length != 0)
	{
		res.send(DBThisSchool);
	} 
})


app.post("/get_year",authenticationMiddleware(),function(req,res)
{
	school_id = Custom_Trim(req.body.iSchool_ID);
	year = GetYearsForSchool(school_id);
	//console.log(year);
	
	res.send(year);
})

app.post("/get_distinct_subjects",authenticationMiddleware(),function(req,res)
{
	school_id = Custom_Trim(req.body.iSchool_ID);
	subject = GetSubjectsForSchool(school_id);
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
	console.clear() ;
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
						//console.log("i am here ");
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



app.get("/create",authenticationMiddleware(),function(req,res)
{
	var status = req.body.status;
	var scenario_name = req.body.scenario_name;
	var j=0;
		
	console.log(req.body.school_id);

	var next_scenario_no;

	var grade_course = [];
	//year = GetYearsForSchool(ischool_id);
	//subject = GetSubjectsForSchool(ischool_id);
	
	year = GetYearsForSchool(req.body.school_id);
	subject = GetSubjectsForSchool(req.body.school_id);

	//console.log("year : " +JSON.stringify(year));
	//console.log("subject : " +JSON.stringify(subject));

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
				var insert_query="INSERT INTO `scenario`(`student_id`, `school_id`, `scenario_no`, `status`, `grade`, `course_id`) VALUES (?,?,?,?,?,?)";
				db.query(insert_query,[req.user.user_id,req.body.school_id,next_scenario_no,status,grade_course[i].grade,grade_course[i].course_id],function(err,result2)
				{
					if(err)
					{
						console.log("Error while inserting data " + err);
						res.redirect("/create");
					}
				});
			}

			db.query("INSERT INTO scenario_name(`student_id`, `school_id`,`scenario_no`, `status`,`scenario_name`) VALUES (?,?,?,?,?)",[req.user.user_id,req.body.school_id,next_scenario_no,status,scenario_name],function(err,result3)
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
	db.query("SELECT display_name, school_id FROM student WHERE id=? LIMIT 1",[req.user.user_id],function(err,result)
	{	
		if(err)
		{
			console.log("Error while retreiving display_name");
		}
		else
		{
			display_name = result[0].display_name;
			school_id = result[0].school_id;
			//res.render("home",{display_name : display_name});
			res.locals.display_name = display_name;
			res.locals.school_id = school_id;
			next();
		}
	});
},function(req,res)
{
	year = GetYearsForSchool(req.iSchool_ID);
	subject = GetSubjectsForSchool(req.iSchool_ID);
	
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
	
	year = GetYearsForSchool(ischool_id);
	subject = GetSubjectsForSchool(ischool_id);
	
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
	year = GetYearsForSchool(ischool_id);
	subject = GetSubjectsForSchool(ischool_id);
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
	db.query("SELECT display_name, school_id FROM student WHERE id=? LIMIT 1",[req.user.user_id],function(err,result)
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
			res.locals.school_id = result[0].school_id;
			next();
		}
	});
},function(req,res)
{
	year = GetYearsForSchool(res.locals.school_id);
	subject = GetSubjectsForSchool(res.locals.school_id);
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
	db.query("SELECT display_name, school_id FROM student WHERE id=? LIMIT 1",[req.user.user_id],function(err,result)
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
			res.locals.school_id = result[0].school_id;
			next();
		}
	});
},function(req,res)
{
	year = GetYearsForSchool(req.iSchool_ID);
	subject = GetSubjectsForSchool(req.iSchool_ID);
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
function GetScoreValue(school_id,iScore)
{
	DBThisSchool = SQLike.q({
			Select: ['*'],
		   From: DBSchools ,
			Where: function(){return (this.id == school_id) && (this.STATUS=='ACTIVE')}			
	   });
	   
	if(DBThisSchool[0].consider_score ==  true)
	{
		for(let i=0;i<result_scores.length;i++)	
		{
			if(result_scores[i][0] == iScore)
			{
				return result_scores[i][1];
			}
		}
	}
	return 0;
}

function Custom_UpperCase(str)
{
	if(str != null)
	{
		return str.toUpperCase();
	}
	return false;
}


//Validate this courses and if meets the requirement, return true flag if so
function IsThisCourseValid(school_id,iCurrentCourseID,SelectedCourseIDs,SelectedCourseScores,iCurrentCourseSubject,iCurrentTrack,SelectedCourseTracks,SelectedCourseGrade) 
{
	
	//console.log(iCurrentCourseID);
	//find if this course is repeat allowed
	var CurrentCourse = [];
	var LocalSelectedCourseIDs = [];
	var LocalSelectedCourseScores = [];

	var ScorePassed = false;

	/*if(iCurrentCourseID == '3610')
	{
		console.log("I am here");
	}*/

	DBCourses = GetDBCoursesForSchool(school_id);
	DBPreReq = GetDBPreReqForSchool(school_id);
	CurrentCourse = SQLike.q({
			Select: ['*'],
		   From: DBCourses ,
			Where: function(){return (this.COURSE_ID == iCurrentCourseID) && (this.SUBJECT == iCurrentTrack)}
	   });
	  PreReqForCourse = SQLike.q({
			Select: ['*'],
		   From: DBPreReq ,
			Where: function(){return (this.TGT_COURSE == iCurrentCourseID) && (this.REQ=='COURSE_PREREQUISITES') && (this.MASTER_CONDITION!='LOWER')},
			OrderBy: ['REQ_ID','SUB_REQ_ID']			
	   });
	//custom_console_print(SelectedCourseIDs);
	for(let i=0;i<SelectedCourseIDs.length;i++)	
	{
		//custom_console_print(SelectedCourseIDs[i] + iCurrentCourseID);
		if(SelectedCourseIDs[i] == iCurrentCourseID)
		{	
			var str = CurrentCourse.REPEATABLE;		
			if( Custom_UpperCase(str) != 'YES')
			{
				return false;
			}
		}
	}
	
	var iMasterCondition = null;	
	if(PreReqForCourse.length >0) 
	{
		iMasterCondition = PreReqForCourse[0].MASTER_CONDITION;
		iMasterCondition = iMasterCondition.split('OR').join(' || ');	//2210A 2230B Output is:"true OR 2"
		iMasterCondition = iMasterCondition.split('AND').join(' && ');
	}
	
	//find out if this course has pre-reqs and process if so	
	for(let i=0;i<PreReqForCourse.length;i++)	
	{		
		for(let j=0;j<SelectedCourseIDs.length;j++)	
		{			
			
			ScorePassed = false;
			
			if(GetScoreValue(school_id,SelectedCourseScores[j]) >= GetScoreValue(school_id,PreReqForCourse[i].REQ_SCORE))
			{
				ScorePassed = true;
			}
			if((PreReqForCourse[i].SRC_COURSE == SelectedCourseIDs[j]) && (ScorePassed == true))
			{
				
				// This specific sub req is passed, let's update the array master condition column
				iMasterCondition = iMasterCondition.replace (PreReqForCourse[i].SUB_REQ_ID, 'true');	
				//custom_console_print(PreReqForCourse[i].SRC_COURSE +SelectedCourseIDs[j] + SelectedCourseScores[j] + PreReqForCourse[i].REQ_SCORE + iMasterCondition[i] );
			}
			else
			{
				LocalSelectedCourseIDs  = [];
				LocalSelectedCourseIDs.push(SelectedCourseIDs[j]);

				LocalSelectedCourseScores = [];
				LocalSelectedCourseScores.push(ScorePassed);
				var iBeforeCount = LocalSelectedCourseIDs.length;

				//var LocalSelectedCourseIDs = SelectedCourseIDs;
				//we will iterate to gather as much recrusively for prior courses
				AddPriorCoursesToArray(LocalSelectedCourseIDs, SelectedCourseIDs[j]);

				for(let k=iBeforeCount;k<LocalSelectedCourseIDs.length;k++)	
				{
					LocalSelectedCourseScores.push(true);
				}
			
				for(let k=0;k<LocalSelectedCourseIDs.length;k++)	
				{	
					if((PreReqForCourse[i].SRC_COURSE == LocalSelectedCourseIDs[k]) && LocalSelectedCourseScores[k] == true)
					//if((PreReqForCourse[i].SRC_COURSE == LocalSelectedCourseIDs[k]) )
					{						
						// This specific sub req is passed, let's update the array master condition column
						iMasterCondition = iMasterCondition.replace (PreReqForCourse[i].SUB_REQ_ID, 'true');	
						//custom_console_print(PreReqForCourse[i].SRC_COURSE +SelectedCourseIDs[j] + SelectedCourseScores[j] + PreReqForCourse[i].REQ_SCORE + iMasterCondition[i] );
					}										
				}
								
			}			
		}
			
	}
	
	//Is this course lower than already selected course (direct or cascade down), collect all prior courses recruisively and check again current course id
	pCourseIDs = [];
	var PreReqForCourse2 = [];
	for(let j=0;j<SelectedCourseIDs.length;j++)	
	{
		PreReqForCourse2 = SQLike.q({
				SelectDistinct: ['SRC_COURSE'],
			   From: DBPreReq ,
				Where: function(){return (this.TGT_COURSE == SelectedCourseIDs[j]) && (this.REQ=='COURSE_PREREQUISITES') && (this.MASTER_CONDITION!='LOWER')  }
		   });
		for(let k=0;k<PreReqForCourse2.length;k++)	
		{
			pCourseIDs.push(PreReqForCourse2[k].SRC_COURSE);
		}
	}
	//we will iterate n times to gather as much recrusively for dependant courses
	AddPriorCoursesToArray(pCourseIDs, PreReqForCourse2);
	
	//now we have list of all prior courses for given selected course, if any of the prior courses matches to current course; remove/mark as valid=no by returning false for this course.
	for(let j=0;j<pCourseIDs.length;j++)	
	{
		if(pCourseIDs[j] == iCurrentCourseID)
		{
			return false;
		}
	}

	/*if(iCurrentCourseID == 2390)
	{
		console.log('i am here for :'+iCurrentCourseID)
	}*/
	
	//Also add course which are marked as LOWER and their predessors to pCourseIDs as prior course to be removed/ignored.
	//Is this course lower than already selected course (direct or cascade down), collect all prior courses recruisively and check again current course id
	pCourseIDs = [];
	PreReqForCourse2 = [];
	for(let j=0;j<SelectedCourseIDs.length;j++)	
	{
		if(Number(iCurrentCourseSubject) > Number(SelectedCourseGrade[j]) )
		{
				PreReqForCourse2 = SQLike.q({
					SelectDistinct: ['TGT_COURSE'],
				   From: DBPreReq ,
					Where: function(){return (this.SRC_COURSE == SelectedCourseIDs[j]) && (this.REQ=='COURSE_PREREQUISITES') && (this.MASTER_CONDITION=='LOWER')  }
			   });
			for(let k=0;k<PreReqForCourse2.length;k++)	
			{
				pCourseIDs.push(PreReqForCourse2[k].TGT_COURSE);
			}
		}
	}
	//we will iterate n times to gather as much recrusively for dependant courses
	AddPriorCoursesToArray(pCourseIDs, PreReqForCourse2);
	
	//now we have list of all prior courses for given selected course, if any of the prior courses matches to current course; remove/mark as valid=no by returning false for this course.
	for(let j=0;j<pCourseIDs.length;j++)	
	{
		if(pCourseIDs[j] == iCurrentCourseID)
		{
			return false;
		}
	}

		
	//now lets' evaluate the master condition for this req id and see if its true, if so return true
	var isValid = false;
	if(PreReqForCourse.length > 0)
	{
		for (let j=0;j<iCascadeConditions;j++)
		{
			iMasterCondition = iMasterCondition.split(j).join(' false ');
		}
		//custom_console_print(iCurrentCourseID + iMasterCondition[i]);
		if (eval(iMasterCondition) == true) 
		{
			//custom_console_print(iMasterCondition[i]);
			isValid = true;
		}
	}
	if(isValid == false && PreReqForCourse.length > 0 )
	{
		return false;
	}

	return true;
}

//Validate all the courses and if meets the requirement, keep VALID flag as 'YES' else change to 'NO' & selected to 'NO' also
function AddPriorCoursesToArray(pCourseIDs, PreReqForCourse2) 
{
	var index = 0; 
	//var num = pCourseIDs.length - 1;
	while(index < pCourseIDs.length)
	//while(index <= num)
	{
		PreReqForCourse2 = SQLike.q({
					SelectDistinct: ['SRC_COURSE'],
				   From: DBPreReq ,
					Where: function(){return (this.TGT_COURSE == pCourseIDs[index]) && (this.REQ=='COURSE_PREREQUISITES') && (this.MASTER_CONDITION!='LOWER') }
			   });
		for(let k=0;k<PreReqForCourse2.length;k++)	
		{
			pCourseIDs.push(PreReqForCourse2[k].SRC_COURSE);
		}
		index++;
		//num = num + PreReqForCourse2.length;
	}	
}


//Validate all the courses and if meets the requirement, keep VALID flag as 'YES' else change to 'NO' & selected to 'NO' also
function ValidateCourseList(ischool_id, RecordsForEntireGrid) 
{
	year = GetYearsForSchool(ischool_id);
	
	var iFirstGrade = year[0].YEAR;
	var SelectedCourseIDs = [];
	var SelectedCourseScores = [];
	var SelectedCourseTracks = [];
	var SelectedCourseGrade = [];
	
	//Let's keep a list of already validated course so that we do not repeat validating them again and again for each drop down.
	var ValidCourseSoFar = [];
	var ValidCourseSoFarStatus = [];
	
	var isPreValidated = false;
	
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
				if(RecordsForEntireGrid[i].AVAILABLECOURSES[j].SELECTED == true && RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID == true)
				{
					SelectedCourseIDs.push(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID);
					SelectedCourseScores.push(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_SCORE);
					SelectedCourseTracks.push(RecordsForEntireGrid[i].SUBJECT);
					SelectedCourseGrade.push(RecordsForEntireGrid[i].GRADE);
				}
			}
		}
		else
		{
			ValidCourseSoFar =[];
			for(let j=0;j<RecordsForEntireGrid[i].AVAILABLECOURSES.length;j++)	
			{	
				iValid = true;
				isPreValidated = false;
				iCurrentCourseID = RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID;
				iCurrentCourseGrade = RecordsForEntireGrid[i].GRADE;
				iCurrentTrack = RecordsForEntireGrid[i].SUBJECT;
				
				/*if (iCurrentCourseID == 3620)
				{
						console.log("i am here for checm h");

				}*/

				if(iCurrentCourseID == 0)
				{
					RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID = true;
					continue;
				}
				for(let d=0;d<ValidCourseSoFar.length;d++)	
				{
					if(ValidCourseSoFar[d].COURSE_ID == iCurrentCourseID && ValidCourseSoFar[d].GRADE == iCurrentCourseGrade)
					{
						isPreValidated = true;
						//console.log(ValidCourseSoFar[d].RESULT1);
						RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID = ValidCourseSoFar[d].STATUS;
						iValid = ValidCourseSoFar[d].RESULT1;
					}
				}
				if(isPreValidated == false)
				{
					iValid = IsThisCourseValid(school_id,iCurrentCourseID,SelectedCourseIDs,SelectedCourseScores,iCurrentCourseGrade,iCurrentTrack,SelectedCourseTracks,SelectedCourseGrade);
					ValidCourseSoFar.push({
						COURSE_ID : iCurrentCourseID,
						GRADE : iCurrentCourseGrade,
						STATUS : iValid
					});
				}
				
				//console.log(iCurrentCourseID + RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID);
				if(iValid == false)
				{
					//console.log(iCurrentCourseID);
					RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID = false;
					//break;
				}
				if((RecordsForEntireGrid[i].AVAILABLECOURSES[j].SELECTED == true) && (RecordsForEntireGrid[i].AVAILABLECOURSES[j].VALID == true))
				{
					SelectedCourseIDs.push(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID);
					SelectedCourseScores.push(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_SCORE);	
					SelectedCourseTracks.push(RecordsForEntireGrid[i].SUBJECT);		
					SelectedCourseGrade.push(RecordsForEntireGrid[i].GRADE);
				}
				
			}
		}
	}
}

app.post("/GetAllCourses",function(req,res)
{
	//console.time('somename');
	var RecordsForEntireGrid = [];	
	var AvailableSubjects = [];
	var result =[];
	var oSchoolGradeReqArr = [];
	var oStateGradeReqArr = [];

	school_id = Custom_Trim(req.body.iSchool_ID);
	DBCourses = GetDBCoursesForSchool(school_id);
	
	DBThisSchool = SQLike.q({
			Select: ['*'],
		   From: DBSchools ,
			Where: function(){return (this.id == school_id) && (this.STATUS=='ACTIVE')}			
	   });

	//custom_console_print("Frontend Array is : "+ JSON.stringify(req.body.arrayOfAllGridInfo));
	for(let i=0;i<req.body.arrayOfAllGridInfo.length;i++)
	{
				result =[];
				result = SQLike.q({
						Select: ['*'],
					   From: DBCourses ,
						Where: function(){return (this.LGRADE <= req.body.arrayOfAllGridInfo[i].GRADE) && (this.HGRADE >= req.body.arrayOfAllGridInfo[i].GRADE) && (this.SUBJECT ==  req.body.arrayOfAllGridInfo[i].SUBJECT)},
						OrderBy: ['COURSE_ID']
				   })
				
				AvailableSubjects = [];				

					for(var j=0;j<result.length;j++)
					{						
						iSelected = false;
						if(DBThisSchool[0].consider_score ==  true)
						{
							if(result[j].MANDATORY == 'YES')
							{
								AvailableSubjects=[];
								AvailableSubjects.push(
								{	COURSE_ID : result[j].COURSE_ID,
									COURSE_NAME : result[j].NAME,
									COURSE_SCORE : NAScore,
									VALID : true,
									MANDATORY : true,
									SELECTED : true,
									CREDIT : result[j].CREDIT,
									LEVEL : result[j].LEVEL
								})	;
								
								break;
							}
							
							// if placeholder course, push it with NA score requirement.
							if(req.body.arrayOfAllGridInfo[i].SelectedSubjectID == result[j].COURSE_ID + ' - ' + NAScore)
							{
								iSelected = true;
							}
							if(result[j].COURSE_ID == 0)
							{
								AvailableSubjects.push(
								{	COURSE_ID : result[j].COURSE_ID,
									COURSE_NAME : result[j].NAME,
									COURSE_SCORE : NAScore,
									VALID : true,
									MANDATORY : false,
									SELECTED : iSelected,
									CREDIT : result[j].CREDIT,
									LEVEL : result[j].LEVEL
								})	;

							}
						}
						else
						{
							if(result[j].MANDATORY == 'YES')
							{
								AvailableSubjects=[];
								AvailableSubjects.push(
								{	COURSE_ID : result[j].COURSE_ID,
									COURSE_NAME : result[j].NAME,
									COURSE_SCORE : '',
									VALID : true,
									MANDATORY : true,
									SELECTED : true,
									CREDIT : result[j].CREDIT,
									LEVEL : result[j].LEVEL
								})	;
								
								break;
							}
							
							// if placeholder course, push it with NA score requirement.
							if(req.body.arrayOfAllGridInfo[i].SelectedSubjectID == result[j].COURSE_ID )
							{
								iSelected = true;
							}
							if(result[j].COURSE_ID == 0)
							{
								AvailableSubjects.push(
								{	COURSE_ID : result[j].COURSE_ID,
									COURSE_NAME : result[j].NAME,
									COURSE_SCORE : '',
									VALID : true,
									MANDATORY : false,
									SELECTED : iSelected,
									CREDIT : result[j].CREDIT,
									LEVEL : result[j].LEVEL
								})	;

							}
						}
							
						
						//if not an placeholder couse, populate it with all possible scores.
						//console.log("1:"+req.body.arrayOfAllGridInfo[i].SelectedSubjectID  + result[j].COURSE_ID)
						if(result[j].COURSE_ID != 0)
						{
							if(DBThisSchool[0].consider_score ==  true)
							{
								for(var is=0;is<result_scores.length;is++)
								{
									iSelected = false;
									if(req.body.arrayOfAllGridInfo[i].SelectedSubjectID == result[j].COURSE_ID + result_scores[is][0])
									{
										iSelected = true;
									}
									
									AvailableSubjects.push(
									{	COURSE_ID : result[j].COURSE_ID,
										COURSE_NAME : result[j].NAME,
										COURSE_SCORE : result_scores[is][0],
										VALID : true,
										MANDATORY : false,
										SELECTED : iSelected,
										CREDIT : result[j].CREDIT,
										LEVEL : result[j].LEVEL
									})	;
								}
							}
							else
							{
								iSelected = false;
									if(req.body.arrayOfAllGridInfo[i].SelectedSubjectID == result[j].COURSE_ID)
									{
										iSelected = true;
									}
									
									AvailableSubjects.push(
									{	COURSE_ID : result[j].COURSE_ID,
										COURSE_NAME : result[j].NAME,
										COURSE_SCORE : '',
										VALID : true,
										MANDATORY : false,
										SELECTED : iSelected,
										CREDIT : result[j].CREDIT,
										LEVEL : result[j].LEVEL
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
		
		//before sending the array back to UI, let's validate each course and mark to false if not a valid choice
		ValidateCourseList(school_id, RecordsForEntireGrid);
		//console.timeEnd('somename');
		
		ValidateSchoolGraduationRequirements(school_id, RecordsForEntireGrid, oSchoolGradeReqArr);
		ValidateStateGraduationRequirements(school_id, RecordsForEntireGrid, oStateGradeReqArr)
		//console.log("Backend Final Array is : "+ JSON.stringify(RecordsForEntireGrid));
		res.send(RecordsForEntireGrid);
});


function ValidateSchoolGraduationRequirements(school_id, RecordsForEntireGrid, oSchoolGradeReqArr)
{
	var tCredits = 0;
	var iTotalCourses = 0;
	DBPreReq = GetDBPreReqForSchool(school_id);
    oSchoolGradPreReq = SQLike.q({
		Select: ['*'],
	   From: DBPreReq ,
		Where: function(){return (this.REQ=='SCHOOL_GRADUATION')},
		OrderBy: ['REQ_ID','SUB_REQ_ID']			
   });
   
   	DBThisSchool = SQLike.q({
			Select: ['*'],
		   From: DBSchools ,
			Where: function(){return (this.id == school_id) && (this.STATUS=='ACTIVE')}
	   });
	
	var minRequiredScore = DBThisSchool[0].SCHOOL_GRAD_MIN_SCORE;
	iConsiderReqMet = true;
	
	oSchoolGradeReqArr = [];
	All_SUBJECTS = GetSubjectsForSchool(school_id);
	
	for(let k=0;k<All_SUBJECTS.length;k++)	
	{
		tCredits = 0;
		//We should actually use TRACK_ID everywhere and not Subject Name
		//iSubId = GetSubjectIDForName(school_id,All_SUBJECTS[k].SUBJECT)
		for(let i=0;i<RecordsForEntireGrid.length;i++)	
		{
				if( Custom_Trim(All_SUBJECTS[k].SUBJECT) == RecordsForEntireGrid[i].SUBJECT)
				{
					for(let j=0;j<RecordsForEntireGrid[i].AVAILABLECOURSES.length;j++)	
					{
						iConsiderReqMet = true;
						if(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID != 0 && DBThisSchool[0].consider_score == true && (GetScoreValue(school_id, RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_SCORE) < GetScoreValue(school_id,minRequiredScore)))
						{							
							iConsiderReqMet = false;
						}
						if(RecordsForEntireGrid[i].AVAILABLECOURSES[j].SELECTED == true && RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID != 0 && iConsiderReqMet == true)
						{
							tCredits = tCredits + RecordsForEntireGrid[i].AVAILABLECOURSES[j].CREDIT;
							iTotalCourses = iTotalCourses + 1;
						}
					}					
				}							
		}
		oSchoolGradeReqArr.push({
			SUBJECT: Custom_Trim(All_SUBJECTS[k].SUBJECT),
			TOTAL_SELECTED: tCredits,
			SCHOOL_GRAD_REQUIRED: 0,
			SCHOOL_ADDITIONAL:0,
			STATUS: false,
			TOTAL_CREDITS: 0,
			TOTAL_CREDITS_FLAG: false,
			TOTAL_COURSES:0,
			TOTAL_COURSES_FLAG:false
		});	
	}
	
	var iTotalCredits = null;
	iTotalCredits = 0;

	iTotalCreditsRequired = 0;
	iElectiveTotalCredits = 0;
	iTotalCoursesRequired = 0;

	for(let k=0;k<oSchoolGradeReqArr.length;k++)	
	{	
		for(let i=0;i<oSchoolGradPreReq.length;i++)	
		{
			if(Custom_Trim(oSchoolGradPreReq[i].MASTER_CONDITION) == oSchoolGradeReqArr[k].SUBJECT)
			{	
				oSchoolGradeReqArr[k].SCHOOL_GRAD_REQUIRED = oSchoolGradPreReq[i].CREDITS;
				iTotalCredits = iTotalCredits + oSchoolGradeReqArr[k].TOTAL_SELECTED;


				if(oSchoolGradeReqArr[k].TOTAL_SELECTED >= oSchoolGradPreReq[i].CREDITS)
				{
					oSchoolGradeReqArr[k].STATUS = true;					
					iElectiveTotalCredits = iElectiveTotalCredits + oSchoolGradeReqArr[k].TOTAL_SELECTED - oSchoolGradPreReq[i].CREDITS;
				}
			}
			if(oSchoolGradPreReq[i].MASTER_CONDITION == 'Total')
			{
				iTotalCreditsRequired = oSchoolGradPreReq[i].CREDITS;
			}
			if(oSchoolGradPreReq[i].MASTER_CONDITION == 'TotalCourses')
			{
				iTotalCoursesRequired = oSchoolGradPreReq[i].CREDITS;
			}	
		}
	}
	
	for(let k=0;k<oSchoolGradeReqArr.length;k++)	
	{
		oSchoolGradeReqArr[k].TOTAL_CREDITS = iTotalCredits;
		if( iTotalCredits >= iTotalCreditsRequired)
		{
			oSchoolGradeReqArr[k].TOTAL_CREDITS_FLAG = true;
		}
		oSchoolGradPreReq[k].TOTAL_COURSES = iTotalCourses;
		if( iTotalCourses >= iTotalCoursesRequired)
		{
			oSchoolGradPreReq[k].TOTAL_COURSES_FLAG = true;
		}
		if(oSchoolGradeReqArr[k].SUBJECT == Custom_Trim('g.Elective'))
		{
			oSchoolGradeReqArr[k].TOTAL_SELECTED = oSchoolGradeReqArr[k].TOTAL_SELECTED + iElectiveTotalCredits
			if(oSchoolGradeReqArr[k].TOTAL_SELECTED >= (oSchoolGradeReqArr[k].SCHOOL_GRAD_REQUIRED))
			{
				oSchoolGradeReqArr[k].STATUS = true;	
			}
		}
	}
	//myprint(oSchoolGradeReqArr);
	
}


function ValidateStateGraduationRequirements(school_id, RecordsForEntireGrid, oStateGradeReqArr)
{
	var tCredits = 0;
	var iTotalCourses = 0;
	DBPreReq = GetDBPreReqForSchool(school_id);
    oStateGradPreReq = SQLike.q({
		Select: ['*'],
	   From: DBPreReq ,
		Where: function(){return (this.REQ=='STATE_GRADUATION')},
		OrderBy: ['REQ_ID','SUB_REQ_ID']			
   });
	
	DBThisSchool = SQLike.q({
		Select: ['*'],
	   From: DBSchools ,
		Where: function(){return (this.id == school_id) && (this.STATUS=='ACTIVE')}
   });
	
	var minRequiredScore = DBThisSchool[0].STATE_GRAD_MIN_SCORE;
	iConsiderReqMet = true;
	
	oStateGradeReqArr = [];
	All_SUBJECTS = GetSubjectsForSchool(school_id);
	
	
	for(let k=0;k<All_SUBJECTS.length;k++)	
	{
		tCredits = 0;
		//We should actually use TRACK_ID everywhere and not Subject Name
		//iSubId = GetSubjectIDForName(school_id,All_SUBJECTS[k].SUBJECT)
		for(let i=0;i<RecordsForEntireGrid.length;i++)	
		{
				if( Custom_Trim(All_SUBJECTS[k].SUBJECT) == RecordsForEntireGrid[i].SUBJECT)
				{
					for(let j=0;j<RecordsForEntireGrid[i].AVAILABLECOURSES.length;j++)	
					{
						iConsiderReqMet = true;
						if(RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID != 0 && DBThisSchool[0].consider_score == true && (GetScoreValue(school_id, RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_SCORE) < GetScoreValue(school_id,minRequiredScore)))
						{							
							iConsiderReqMet = false;
						}
						if(RecordsForEntireGrid[i].AVAILABLECOURSES[j].SELECTED == true && RecordsForEntireGrid[i].AVAILABLECOURSES[j].COURSE_ID != 0 && iConsiderReqMet == true)
						{
							tCredits = tCredits + RecordsForEntireGrid[i].AVAILABLECOURSES[j].CREDIT;
							iTotalCourses = iTotalCourses + 1;
						}
					}					
				}							
		}
		oStateGradeReqArr.push({
			SUBJECT: Custom_Trim(All_SUBJECTS[k].SUBJECT),
			TOTAL_SELECTED: tCredits,
			STATE_GRAD_REQUIRED: 0,
			STATE_ADDITIONAL:0,
			STATUS: false,
			TOTAL_CREDITS: 0,
			TOTAL_CREDITS_FLAG: false,
			TOTAL_COURSES:0,
			TOTAL_COURSES_FLAG:false
		});	
	}
	
	var iTotalCredits = null;
	iTotalCredits = 0;

	iTotalCreditsRequired = 0;
	iElectiveTotalCredits = 0;
	iTotalCoursesRequired = 0;

	for(let k=0;k<oStateGradeReqArr.length;k++)	
	{		
		for(let i=0;i<oStateGradPreReq.length;i++)	
		{
			if(Custom_Trim(oStateGradPreReq[i].MASTER_CONDITION) == oStateGradeReqArr[k].SUBJECT)
			{	
				oStateGradeReqArr[k].STATE_GRAD_REQUIRED = oStateGradPreReq[i].CREDITS;
				iTotalCredits = iTotalCredits + oStateGradeReqArr[k].TOTAL_SELECTED;

				if(oStateGradeReqArr[k].TOTAL_SELECTED >= oStateGradPreReq[i].CREDITS)
				{
					oStateGradeReqArr[k].STATUS = true;					
					iElectiveTotalCredits = iElectiveTotalCredits + oStateGradeReqArr[k].TOTAL_SELECTED - oStateGradPreReq[i].CREDITS;
				}
			}
			if(oStateGradPreReq[i].MASTER_CONDITION == 'Total')
			{
				iTotalCreditsRequired = oStateGradPreReq[i].CREDITS;
			}
			if(oStateGradPreReq[i].MASTER_CONDITION == 'TotalCourses')
			{
				iTotalCoursesRequired = oStateGradPreReq[i].CREDITS;
			}			
			
		}
	}
	
	for(let k=0;k<oStateGradeReqArr.length;k++)	
	{
		oStateGradeReqArr[k].TOTAL_CREDITS = iTotalCredits;
		if( iTotalCredits >= iTotalCreditsRequired)
		{
			oStateGradeReqArr[k].TOTAL_CREDITS_FLAG = true;
		}
		oStateGradeReqArr[k].TOTAL_COURSES = iTotalCourses;
		if( iTotalCourses >= iTotalCoursesRequired)
		{
			oStateGradeReqArr[k].TOTAL_COURSES_FLAG = true;
		}
		if(oStateGradeReqArr[k].SUBJECT == Custom_Trim('g.Elective'))
		{
			oStateGradeReqArr[k].TOTAL_SELECTED = oStateGradeReqArr[k].TOTAL_SELECTED + iElectiveTotalCredits
			if(oStateGradeReqArr[k].TOTAL_SELECTED >= (oStateGradeReqArr[k].STATE_GRAD_REQUIRED))
			{
				oStateGradeReqArr[k].STATUS = true;	
			}
		}
	}
	myprint(oStateGradeReqArr);
	
}

