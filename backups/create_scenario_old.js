//Use this when can't get number of subjects from allSubjects
//var get_sub_len =  $("#get_sub_len").html();

//calls made sync. Check on this later on 
//jQuery.ajaxSetup({ async: false });

$(document).ready(function()
{
	var err_flag1=0;
	var allSubjects;
	var allYears;
	var arrayOfAllGridInfo = [];  //year,subject,subject selected if any
	
	
	//year();
	//subject();

	//NUMBER OF YEARS IN THE TABLE
	function year()
	{
		return $.ajax
				({
				   	type: "GET",
				    url: "http://localhost:3000/get_year",
				    dataType: "json",
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
	function subject()
	{
		return $.ajax
				({
				   	type: "GET",
				    url: "http://localhost:3000/get_distinct_subjects",
				    dataType: "json",
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
		//console.log("changed");
		FetchAllCourses();
		
	});
		
	//code to create JSON of year,subject and selected subject
	$.when(subject(),year()).then(function () 
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
		   	type: "GET",
		    url: "http://localhost:3000/GetAllCourses2",
		    dataType: "json",
		    data : {arrayOfAllGridInfo} ,		    	   
		    success: function (RecordsForEntireGrid)
		    {
				console.log("all grid info : "+ JSON.stringify(RecordsForEntireGrid))
						
						
						for(var k=0;k<RecordsForEntireGrid.length;k++)	{
								var y9_s = $("#y"+RecordsForEntireGrid[k].GRADE+"_s"+RecordsForEntireGrid[k].SUBJECT);
								
								if (RecordsForEntireGrid[k].SELECTEDID != null) {
									y9_s.append($("<option></option>").val(RecordsForEntireGrid[k].SELECTEDID+RecordsForEntireGrid[k].SELECTEDSCORE).html(RecordsForEntireGrid[k].SELECTEDID+" - "+RecordsForEntireGrid[k].SELECTEDNAME+" - "+RecordsForEntireGrid[k].SELECTEDSCORE));
									y9_s.prop('selectedIndex',0);
								}
								for(var l=0;l<RecordsForEntireGrid[k].AVAILABLECOURSES.length;l++)	{
									y9_s.append($("<option></option>").val(RecordsForEntireGrid[k].AVAILABLECOURSES[l].SUBTRACK_ID+RecordsForEntireGrid[k].AVAILABLECOURSES[l].SUBTRACK_SCORE).html(RecordsForEntireGrid[k].AVAILABLECOURSES[l].SUBTRACK_ID+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].SUBTRACK_NAME+" - "+RecordsForEntireGrid[k].AVAILABLECOURSES[l].SUBTRACK_SCORE));
									if(RecordsForEntireGrid[k].AVAILABLECOURSES.length == 1){
										y9_s.prop('selectedIndex',0);
									}
								}
								
								if(RecordsForEntireGrid[k].AVAILABLECOURSES.length == 0 && RecordsForEntireGrid[k].SELECTEDID == null){
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
								
				if(y_s.val() == "")
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




