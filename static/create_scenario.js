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
	//console.log("school id is : "+iSchool_ID);

	var scenario_info = [] ;
	scenario_info = JSON.parse($("#scenario_info").val());
	//console.log("scenario_info : "+ JSON.stringify(scenario_info));

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
		flag = 0;
		FetchAllCourses(flag);
		
	});
		
	//code to create JSON of year,subject and selected subject
	$.when(get_subject(),get_year()).then(function () 
	{
		//var timeStampInMs = window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();
		//For edit option playing with scenario_name length. Later on we can pass Scenario no or flag from backend to check if create
		//button presses or edit

		//console.log("scenario_name is : "+ $("#scenario_name").val())
		var flag;
		if($("#scenario_no").val() == 0)
		{
			//console.log("Create button pressed");
			flag = 0;
			FetchAllCourses(flag);  //parameter passed to inform if function called for create or edit 
		}
		else
		{
			console.log("Edit button pressed");
			flag = 1;
			FetchAllCourses(flag);  //parameter passed to inform if function called for create or edit	
		}
		


		//window.alert("done");
	})

	function clearBox(boxflag)
	{
		//console.log("clear");
		$(boxflag).empty();
		return 0;
	}

	function schoolReqBox(data)
	{
		//console.log("data is : "+JSON.stringify(data));
		var boxflag = "#school_list";
		clearBox(boxflag);
		//$("#school_list").empty();
		var oOutputStr = null;
		if(data.length>0)
		{
		for(var i=0;i<data.length;i++)
		{
			oOutputStr = null;
			if(data[i].SCHOOL_GRAD_REQUIRED != 0)
				{
				oOutputStr = "In " + data[i].SUBJECT_NAME + ", you need: " +  data[i].SCHOOL_GRAD_REQUIRED + " Credits & so far you have achieved :" + data[i].TOTAL_SELECTED ;


				//school_list txt / name to below
				
				if(data[i].TOTAL_CREDITS_FLAG == true)
				{
					$("#school_label").html("<h3>School Requirements are completed.</h3>")	
					
				}
				else
				{
					$("#school_label").html("<h3>School Requirements are not yet completed.</h3>")	
				}	

				//I dont know the logic of when the check box will be ticket so giving the functionality
				if(data[i].STATUS == true)
				{
					$("#school_list").append("<li>"+oOutputStr+", Requirement is satisfied."+ "</li>")	
				}
				else
				{
					$("#school_list").append("<li>"+oOutputStr+", Requirement is not yet satisfied. "+ "</li>")		
				}			
			}
		}
	}
	else
	{
		$("#school_box").hide();
	}
	}
	
	function stateReqBox(data)
	{
		//console.log("data is : "+JSON.stringify(data));
		var boxflag = "#state_list";
		clearBox(boxflag);
		var oOutputStr = null;
		if(data.length>0)
		{
			for(var i=0;i<data.length;i++)
			{
				oOutputStr = null;
					if(data[i].STATE_GRAD_REQUIRED != 0)
					{
					oOutputStr = "In " + data[i].SUBJECT_NAME + ", you need: " +  data[i].STATE_GRAD_REQUIRED + " Credits & so far you have achieved :" + data[i].TOTAL_SELECTED ;
					
					if(data[i].TOTAL_COURSES_FLAG == true)
					{
						$("#state_label").html("<h3>State Requirements are completed.</h3>")	
						
					}
					else
					{
						$("#state_label").html("<h3>State Requirements are not yet completed.</h3>")	
					}	
					
					//I dont know the logic of when the check box will be ticket so giving the functionality
					if(data[i].STATUS == true)
					{
						//$("#state_list").append("<li>"+oOutputStr+" : "+ " <input type='checkbox' checked></li>")	
						$("#state_list").append("<li>"+oOutputStr+", Requirement is satisfied."+ "</li>")	
					}
					else
					{
						//$("#state_list").append("<li>"+oOutputStr+" : "+ " <input type='checkbox'></li>")		
						$("#state_list").append("<li>"+oOutputStr+", Requirement is not yet satisfied. "+ "</li>")		
					}	
				}
			}	
		}	
		else
		{
			$("#state_box").hide() ;
		}
	}

function FetchAllCourses(flag)
	{
		var iSelectedSubjectID;
		var iSelectedSubjectName;
		var str;
		var arrayOfAllGridInfo = [];
		var iSelectedIndex = 0;
		var scenario_no = [];
		//var optionFlag = [];

		if(flag == 0)
		{
			//console.log("function called from create ");
			scenario_no.push($("#scenario_no").val());
			arrayOfAllGridInfo.length = 0;
			//optionFlag.length = 0;
			//optionFlag.push("Other_runs");
			//console.log(JSON.stringify(allSubjects)); 
			for(var i=0;i<allSubjects.length;i++)
			{
				for(var j=0;j<allYears.length;j++)
				{
					str = "#y"+allYears[j].YEAR_SEQ+"_s"+allSubjects[i].SUBJECT_ID
					//iSelectedSubjectID = $("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).val() 
					//iSelectedSubjectName = $("#y"+allYears[i].YEAR+"_s"+allSubjects[j].SUBJECT).val() 
					iSelectedSubjectID = $(str).val();				

					arrayOfAllGridInfo.push(
					{
						'GRADE' : allYears[j].YEAR,
						'YEAR_SEQ':allYears[j].YEAR_SEQ,
						'SUBJECT' : allSubjects[i].SUBJECT_ID,
						'SelectedSubjectID' : iSelectedSubjectID
					})
				}
			}

			//console.log("array is : " + JSON.stringify(arrayOfAllGridInfo));
		}
		else if(flag == 1)
		{
			//console.log("function called from edit");
			scenario_no.push($("#scenario_no").val());
			arrayOfAllGridInfo.length = 0;
			//optionFlag.length = 0;
			//optionFlag.push("Edit_first_run");
			/*arrayOfAllGridInfo.push(
			{
				'dummy' : "toBeDeleteData" 
			})*/

		//	console.log("year : "+ JSON.stringify(allYears) + "\n subjects : "+JSON.stringify(allSubjects));

			var yearChange,subjectChange;

			for(var i=0;i<scenario_info.length;i++)
			{
				if(i % allYears.length == 0)
				{
					yearChange = 0;
					if(i==0)
					{
						subjectChange = 0;
					}
					else
					{
						subjectChange++;
					}
				}

				arrayOfAllGridInfo.push(
				{
					'GRADE' : allYears[yearChange].YEAR,
					'YEAR_SEQ': scenario_info[i].grade,
					'SUBJECT' : allSubjects[subjectChange].SUBJECT_ID,
					'SelectedSubjectID' : scenario_info[i].course_id
				})

				yearChange++;				
			}			
		}
		
		//console.log("all grid info : "+ JSON.stringify(arrayOfAllGridInfo))		
		
		ResetAllDropDowns();
		
		
		return $.ajax
		({
		   	type: "POST",
		    url: "http://localhost:3000/GetAllCourses",
		    dataType: "json",
		    data : {iSchool_ID, scenario_no, arrayOfAllGridInfo} ,		    	   
		    success: function (oRecordsForEntireGrid)
		    {
				//console.log("all grid info : "+ JSON.stringify(RecordsForEntireGrid))
				schoolReqBox(oRecordsForEntireGrid[1]);
				stateReqBox(oRecordsForEntireGrid[2]);
				RecordsForEntireGrid = oRecordsForEntireGrid[0];
						for(var k=0;k<RecordsForEntireGrid.length;k++)	{
								var y9_s = $("#y"+RecordsForEntireGrid[k].YEAR_SEQ +"_s"+RecordsForEntireGrid[k].SUBJECT);
								iAdded = 0;	
								iSelectedIndex = 0;						
								for(var l=0;l<RecordsForEntireGrid[k].AVAILABLECOURSES.length;l++)	{
									if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].VALID == true)
									{											
										if(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE != '')
										{
											y9_s.append($("<option></option>").val(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+"~"+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE).html(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_NAME+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_SCORE));
										}
										else
										{
											y9_s.append($("<option></option>").val(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID).html(RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_ID+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].COURSE_NAME));
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
				$("#y"+allYears[i].YEAR_SEQ+"_s"+allSubjects[j].SUBJECT_ID).empty();
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
					school_cs_link = DBThisSchool[0].CS_LINK;
					//console.log("school_cs_link : "+JSON.stringify(school_cs_link));
					window.open(school_cs_link,"_blank");
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
						console.log('err: '+XMLHttpRequest.status);
				}
		}); 
		
	})

	$(window).keydown(function(event)
	{
		if(event.keyCode == 13)
		{
  			event.preventDefault();
  			namecheck();
  			$("#validate").click();    			
			return false;
		}
	});

	function namecheck()
	{
		var name = $("#scenario_name").val()
		$("#validate").prop('disabled',true);
		if(name != "")
		{
			$.ajax({
			   	type: "GET",
			    url: "http://localhost:3000/scenario_name",
			    async : false,
			    data : {scenario_name : name},
			    dataType: "json",
			    success: function(err_flag)
			    {
					err_flag1 =err_flag.err_flag;
					if(err_flag1 == 1)
					{
						//console.log("same name");
						$("#err_msg").show();
					}				
					else if(err_flag1 == 0)
					{	
						$("#err_msg").hide();
					}
					$("#validate").prop('disabled',false);
		        },
		        error: function(XMLHttpRequest, textStatus, errorThrown)
		        {
		          	console.log('err: '+XMLHttpRequest.status);
		        }
			});
		}	
	}



	$("#scenario_name").change(function()
	{
		namecheck();
	});

	
	

	$("#validate").click(function()
	{
		var flag = 0;
		
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
	});
});






