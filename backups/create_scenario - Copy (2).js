//Use this when can't get number of subjects from allSubjects
//var get_sub_len =  $("#get_sub_len").html();

//calls made sync. Check on this later 	on 
//jQuery.ajaxSetup({ async: false });

$(document).ready(function()
{
	var err_flag1=0;
	var allSubjects;
	var allYears;
	var arrayOfAllGridInfo = [];  //year,subject,subject selected if any
	var iSchool_ID = null;

	iSchool_ID = $('#school_id').val()
	console.log("school id is : "+iSchool_ID);

	//get_year();
	//get_subject();
	//var subject = allSubjects;
	//var year = allYears;

	//NUMBER OF YEARS IN THE TABLE
	function get_year()
	{
		return $.ajax
				({
				   	type: "POST",
				    url: "http://localhost:3000/get_year",
				    dataType: "json",
					data : {iSchool_ID} ,	
				    success: function (year)
				    {
						
						allYears = year;
						//console.log("Years : "+JSON.stringify(allYears));
			        },
			        error: function(XMLHttpRequest, textStatus, errorThrown)
			        {
			          	console.log('err: '+XMLHttpRequest.status);
			        }
				}); 
	}

	//DISTINCT SUBJECTS FROM THE DATABASE TO CREATE THE TABLE
	function get_subject()
	{
		return $.ajax
				({
				   	type: "POST",
				    url: "http://localhost:3000/get_distinct_subjects",
				    dataType: "json",
					data : {iSchool_ID} ,
				    success: function (distinct_sub)
				    {
						
						allSubjects = distinct_sub;
						//console.log("SUBJECTS : "+JSON.stringify(distinct_sub));
			   			//console.log("Number of Subjects : "+ allSubjects.length);
													
			        },
			        error: function(XMLHttpRequest, textStatus, errorThrown)
			        {
			          	console.log('err: '+XMLHttpRequest.status);
			        }
				});
	}
	//dependent_drop();
	
	$(".grid").change(function(){
		
		console.log("changed");
		FetchAllCourses();
		
	});
		
	//code to create JSON of year,subject and selected subject
	$.when(get_subject(),get_year()).then(function () 
	{
		//var timeStampInMs = window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();

		FetchAllCourses();


		//window.alert("done");
	})


function FetchAllCourses()
	{
		var iSelectedSubjectID;
		var iSelectedSubjectName;
		var str;
		var arrayOfAllGridInfo = [];
		var iSelectedIndex = 0;
		for(var i=0;i<allYears.length;i++)
		{
			for(var j=0;j<allSubjects.length;j++)
			{
				str = "#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT
				//iSelectedSubjectID = $("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).val() 
				//iSelectedSubjectName = $("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).val() 
				iSelectedSubjectID = $(str).val();				

				arrayOfAllGridInfo.push(
				{
					'GRADE' : allYears[i].YEAR,
					'SUBJECT' : allSubjects[j].SUBJECT,
					'SelectedSubjectID' : iSelectedSubjectID,
				})
			}
		}
		//console.log("all grid info : "+ JSON.stringify(arrayOfAllGridInfo))		
		
		ResetAllDropDowns();
		
		
		return $.ajax
		({
		   	type: "POST",
		    url: "http://localhost:3000/GetAllCourses",
		    dataType: "json",
		    data : {iSchool_ID, arrayOfAllGridInfo} ,		    	   
		    success: function (RecordsForEntireGrid)
		    {
				//console.log("all grid info : "+ JSON.stringify(RecordsForEntireGrid))
						for(var k=0;k<RecordsForEntireGrid.length;k++)	{
								var y9_s = $("#y"+RecordsForEntireGrid[k].GRADE+"_s"+RecordsForEntireGrid[k].SUBJECT);
								iAdded = 0;	
								iSelectedIndex = 0;						
								for(var l=0;l<RecordsForEntireGrid[k].AVAILABLECOURSES.length;l++)	{
									if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].VALID == true)
									{											
										if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE != '')
										{
											y9_s.append($("<option></option>").val(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE).html(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_NAME+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE + " - " + RecordsForEntireGrid[k].AVAILABLECOURSES[l].CREDIT));
										}
										else
										{
											y9_s.append($("<option></option>").val(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID).html(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_NAME+" - "+ RecordsForEntireGrid[k].AVAILABLECOURSES[l].CREDIT));
										}
										iAdded++;
									}
									
									if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].SELECTED == true)
									{
										iSelectedIndex = iAdded-1;
									}
																		
								}
								y9_s.prop('selectedIndex',iSelectedIndex);
								
								if(RecordsForEntireGrid[k].AVAILABLECOURSES.length == 0)
								{
										y9_s.append($("<option></option>").val(""));
										y9_s.hide();
								}
							}	
			
	        },
	        error: function(XMLHttpRequest, textStatus, errorThrown)
	        {
	          	console.log('err: '+XMLHttpRequest.status);
	        }
		});
	}
	
	
	function FetchAllCoursesForFirstTime()
	{
		
		ResetAllDropDowns();
		
		return $.ajax
		({
		   	type: "POST",
		    url: "http://localhost:3000/GetAllCoursesForFirstTime",
			//url: "http://localhost:3000/GetAllCourses",
		    dataType: "json",
		    data : {iSchool_ID} ,		    	   
		    success: function (RecordsForEntireGrid)
		    {
				//console.log("all grid info : "+ JSON.stringify(RecordsForEntireGrid))
						for(var k=0;k<RecordsForEntireGrid.length;k++)	{
								var y9_s = $("#y"+RecordsForEntireGrid[k].GRADE+"_s"+RecordsForEntireGrid[k].SUBJECT);
								iAdded = 0;	
								iSelectedIndex = 0;						
								for(var l=0;l<RecordsForEntireGrid[k].AVAILABLECOURSES.length;l++)	{
									if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].VALID == true)
									{											
										y9_s.append($("<option></option>").val(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE).html(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_NAME+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE + " - " + RecordsForEntireGrid[k].AVAILABLECOURSES[l].CREDIT));
										iAdded++;
									}
									
									if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].SELECTED == true)
									{
										iSelectedIndex = iAdded-1;
									}
																		
								}
								y9_s.prop('selectedIndex',iSelectedIndex);
								
								if(RecordsForEntireGrid[k].AVAILABLECOURSES.length == 0)
								{
										y9_s.append($("<option></option>").val(""));
										y9_s.hide();
								}
							}	
			
	        },
	        error: function(XMLHttpRequest, textStatus, errorThrown)
	        {
	          	console.log('err: '+XMLHttpRequest.status);
	        }
		});
	}

	function FetchCoursesForChangedTrack(Changed_Year,Changed_Subject,iSelectedSubjectID)
	{

		var iSelectedSubjectID;
		var iSelectedSubjectName;
		var str;
		var arrayOfAllGridInfo = [];
		var iSelectedIndex = 0;
		for(var i=0;i<allYears.length;i++)
		{
			for(var j=Changed_Subject;j<Changed_Subject+1;j++)
			{
				str = "#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT
				//iSelectedSubjectID = $("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).val() 
				//iSelectedSubjectName = $("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).val() 
				iSelectedSubjectID = $(str).val();				

				arrayOfAllGridInfo.push(
				{
					'GRADE' : allYears[i].YEAR,
					'SUBJECT' : allSubjects[j].SUBJECT,
					'SelectedSubjectID' : iSelectedSubjectID,
				})
			}
		}
	

		return $.ajax
		({
		   	type: "POST",
				url: "http://localhost:3000/GetCoursesUponChange",
				dataType: "json",
		    data : {iSchool_ID, arrayOfAllGridInfo} ,		    	   
		    success: function (RecordsForEntireGrid)
		    {
				//console.log("all grid info : "+ JSON.stringify(RecordsForEntireGrid))
						for(var k=0;k<RecordsForEntireGrid.length;k++)	{
								var y9_s = $("#y"+RecordsForEntireGrid[k].GRADE+"_s"+RecordsForEntireGrid[k].SUBJECT);
								y9_s.empty();
								iAdded = 0;	
								iSelectedIndex = 0;						
								for(var l=0;l<RecordsForEntireGrid[k].AVAILABLECOURSES.length;l++)	{
									
									if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].VALID == true)
									{											
										y9_s.append($("<option></option>").val(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE).html(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_NAME+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE + " - " + RecordsForEntireGrid[k].AVAILABLECOURSES[l].CREDIT));
										iAdded++;
									}
									
									if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].SELECTED == true)
									{
										iSelectedIndex = iAdded-1;
									}
																		
								}
								y9_s.prop('selectedIndex',iSelectedIndex);
								
								if(RecordsForEntireGrid[k].AVAILABLECOURSES.length == 0)
								{
										y9_s.append($("<option></option>").val(""));
										y9_s.hide();
								}
							}	
			
	        },
	        error: function(XMLHttpRequest, textStatus, errorThrown)
	        {
	          	console.log('err: '+XMLHttpRequest.status);
	        }
		});
		
	}
	
	function ResetAllDropDowns()
	{
		for(var i=0;i<allYears.length;i++)
		{
			for(var j=0;j<allSubjects.length;j++)
			{				
				/*for (var k=0;k<$("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).length;k++)
				{				
					$("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).remove(k);
				}*/
				$("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).empty();
			}
		}
	}

	


	$("#bLink").click(function()
	{
		return $.ajax
		({
				type: "POST",
				url: "http://localhost:3000/get_cs_link_url",
				dataType: "json",
				data : {iSchool_ID} ,
				success: function (DBThisSchool)
				{
				school_cs_link = DBThisSchool;
				console.log("school_cs_link : "+JSON.stringify(school_cs_link));
				
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
						console.log('err: '+XMLHttpRequest.status);
				}
		}); 
		window.open(school_cs_link,"_blank");
	})

	$("#scenario_name").change(function()
	{
		var name = $("#scenario_name").val()
		if(name != "")
		{
			$.ajax({
			   	type: "GET",
			    url: "http://localhost:3000/scenario_name",
			    data : {scenario_name : name},
			    dataType: "text json",
			    success: function(err_flag)
			    {
					err_flag1 =err_flag.err_flag;
					if(err_flag1 == 1)
					{
						$("#err_msg").show();
					}				
					else if(err_flag1 == 0)
					{	
						$("#err_msg").hide();
					}
		        },
		        error: function(XMLHttpRequest, textStatus, errorThrown)
		        {
		          	console.log('err: '+XMLHttpRequest.status);
		        }
			});
		}	
	})

	

	$("#validate").click(function()
	{
		var flag = 0;
		//console.log("all subject : "+allSubjects.length);
		//console.log("all Years : "+allYears.length);

		for(var l=1;l<= allSubjects.length;l++)
		{
			for(var m=1;m<= allYears.length;m++)
			{
				var y_s = $("#y"+allYears[m-1].YEAR+"_s"+allSubjects[l-1].SUBJECT);
								
				if(y_s.val() == "null" || y_s.val() == "0NA")
				{
					flag=1;	
				}					
			}
		}
	
		if(flag == 1)
		{
			alert("Enter all fields");
		}
		else
		{
			if($("#scenario_name").val() == "")
			{
				alert("Enter scenario name");
			}
			else
			{
				if(err_flag1 == 1)
				{
					alert("scenario name already exists");
				}
				else
				{
					$("#save").click();	
				}					
			}					
		}	

	});
	
	
	
	
});




