//ALL AJAX CALL FOR EACH SELECT BOX TO GET THE SUB_TRACK (dependent_drop function)
	
	function dependent_drop()
	{
		//ENGLISH DROPDOWNS
		$.ajax
		({
		   	type: "GET",
		    url: "http://localhost:3000/firstYear",
		    dataType: "json",
		    data : { subject : 'ENGLISH'
				   },
		    success: function (sub_track)
		    {
				
				console.log("sub_track"+JSON.stringify(sub_track));
				var div_y9_s = $("#div_y9_sENGLISH");
				var y9_s = $("#y9_sENGLISH");
				//sub_track.length = 0;
				if(sub_track.length == 0)
				{
					console.log("No data for 9th grade");
					
					div_y9_s.val("SUBJECT NOT AVAILABLE").attr('readonly','readonly');
					div_y9_s.show();
					show_10English();					
				}
				else if(sub_track[0].MANDATORY == 'YES')
				{
					//y_s = $("#y"+mandatory_courses[i].LGRADE+"_s"+mandatory_courses[i].SUBJECT);
										
					y9_s.append(
					$("<option></option>").val(sub_track[0].NAME).html(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME)
					);

					y9_s.prop('selectedIndex',1);
					//y_s.attr('hidden','hidden');

					div_y9_s.val(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME).attr('readonly','readonly');
					div_y9_s.show();
					show_10English();			
					
				}
				else
				{
					div_y9_s.show();
					for(var i=0;i<sub_track.length;i++)
					{
						y9_s.append(
						$("<option></option>").val(sub_track[i].NAME).html(sub_track[i].NAME)
						);	
						
					}
				}			
		    },
		    error: function(XMLHttpRequest, textStatus, errorThrown)
		   	{
		   		console.log('err: '+XMLHttpRequest.status);
		   	}
		});

		$("#y9_sENGLISH").change(function()
		{			
			show_10English();
		});

		function show_10English()
		{	
			var arr = [];
			for(var i=9;i<10;i++)
			{
				arr.push($('#y'+i+'_sENGLISH').val());
			}

			$.ajax
			({
				type: "GET",
				url: "http://localhost:3000/toFillDataInCell",
				dataType: "json",
				//data : { data1 : $('#y9_sENGLISH').val(),
				//		 grade : 10
				//		},
				data : { data : arr,
						 grade : 10,
						 subject : 'ENGLISH'
					   },
				success: function (sub_track)
				{
					console.log("grade 10 subjects : " + JSON.stringify(sub_track));
					var div_y10_s = $("#div_y10_sENGLISH");
					var y10_s = $("#y10_sENGLISH");
					y10_s.children("option").not(':first').remove();
					$("#y11_sENGLSIH").children("option").not(':first').remove();
					$("#y12_sENGLISH").children("option").not(':first').remove();
					$("#div_y10_sENGLISH").hide();
					$("#div_y11_sENGLISH").hide();
					$("#div_y12_sENGLISH").hide();
					//console.log($("#y9_sMATHS").val());
					if(sub_track.length == 0)
					{
						console.log("No data for 10th grade");
						
						div_y10_s.val("SUBJECT NOT AVAILABLE").attr('readonly','readonly');
						div_y10_s.show();
						show_11English();					
					}
					else if(sub_track[0].MANDATORY == 'YES')
					{
						//y_s = $("#y"+mandatory_courses[i].LGRADE+"_s"+mandatory_courses[i].SUBJECT);
												
						y10_s.append(
						$("<option></option>").val(sub_track[0].NAME).html(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME)
						);

						y10_s.prop('selectedIndex',1);
						//y_s.attr('hidden','hidden');

						div_y10_s.val(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME).attr('readonly','readonly');
						div_y10_s.show();
						show_11English();			
						
					}
					else
					{
						div_y10_s.hide();
						for(var i=0;i<sub_track.length;i++)
						{
							y10_s.append(
							$("<option></option>").val(sub_track[i].NAME).html(sub_track[i].NAME)
							);	
							
						}
					}							
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
					console.log('err: '+XMLHttpRequest.status);
				}
			});
		}			
		
		$("#y10_sENGLISH").change(function()
		{			
			show_11English();
		});	

		function show_11English()
		{
			var arr = [];
			for(var i=9;i<11;i++)
			{
				arr.push($('#y'+i+'_sENGLISH').val());
			}

			$.ajax
			({
			  	type: "GET",
			    url: "http://localhost:3000/toFillDataInCell",
			    dataType: "json",
			    //data : { data1 : $('#y9_sENGLISH').val(),
			    //		 data2 : $('#y10_sENGLISH').val(),	
			    //		 grade : 11
				//		},
				data : { data : arr,
						 grade : 11,
						 subject : 'ENGLISH'
					   },
				success: function (sub_track)
				{
					console.log("grade 11 subjects : " + JSON.stringify(sub_track));
					var div_y11_s = $("#div_y11_sENGLISH");
					var y11_s = $("#y11_sENGLISH");
					y11_s.children("option").not(':first').remove();
					$("#y12_sENGLISH").children("option").not(':first').remove();
					$("#div_y11_sENGLISH").hide();
					$("#div_y12_sENGLISH").hide();
					//console.log($("#y9_sMATHS").val());

					if(sub_track.length == 0)
					{
						console.log("No data for 11th grade");
						
						div_y11_s.val("SUBJECT NOT AVAILABLE").attr('readonly','readonly');
						div_y11_s.show();
						show_12English();					
					}
					else if(sub_track[0].MANDATORY == 'YES')
					{
						//y_s = $("#y"+mandatory_courses[i].LGRADE+"_s"+mandatory_courses[i].SUBJECT);
												
						y11_s.append(
						$("<option></option>").val(sub_track[0].NAME).html(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME)
						);

						y11_s.prop('selectedIndex',1);
						//y_s.attr('hidden','hidden');

						div_y11_s.val(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME).attr('readonly','readonly');
						div_y11_s.show();
						show_12English();			
						
					}
					else
					{
						div_y11_s.hide();
						for(var i=0;i<sub_track.length;i++)
						{
							y11_s.append(
							$("<option></option>").val(sub_track[i].NAME).html(sub_track[i].NAME)
							);	
							
						}
					}							
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   	console.log('err: '+XMLHttpRequest.status);
				}
			});
		}

		$("#y11_sENGLISH").change(function()
		{			
			show_12English();
		});

		function show_12English()
		{
			var arr = [];
			for(var i=9;i<12;i++)
			{
				arr.push($('#y'+i+'_sENGLISH').val());
			}

			$.ajax
			({
			  	type: "GET",
			    url: "http://localhost:3000/toFillDataInCell",
			    dataType: "json",
			    //data : { data1 : $('#y9_sENGLISH').val(),
			    //		 data2 : $('#y10_sENGLISH').val(),
			    //		 data3 : $('#y11_sENGLISH').val(),	
			    //		 grade : 11
				//		},
				data : { data : arr,
						 grade : 12,
						 subject : 'ENGLISH'
					   },
				success: function (sub_track)
				{
					console.log("grade 12 subjects : " + JSON.stringify(sub_track));
					var div_y12_s = $("#div_y12_sENGLISH");
					var y12_s = $("#y12_sENGLISH");
					y12_s.children("option").not(':first').remove();
					$("#y12_sENGLISH").children("option").not(':first').remove();
					$("#div_y12_sENGLISH").hide();

					if(sub_track.length == 0)
					{
						console.log("No data for 12th grade");
						div_y12_s.val("SUBJECT NOT AVAILABLE").attr('readonly','readonly');
						div_y12_s.show();
						//show_10English();					
					}
					if(sub_track[0].MANDATORY == 'YES')
					{
						//y_s = $("#y"+mandatory_courses[i].LGRADE+"_s"+mandatory_courses[i].SUBJECT);
												
						y12_s.append(
						$("<option></option>").val(sub_track[0].NAME).html(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME)
						);

						y12_s.prop('selectedIndex',1);
						//y_s.attr('hidden','hidden');

						div_y12_s.val(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME).attr('readonly','readonly');
						div_y12_s.show();
						show_12English();			
						
					}
					else
					{
						div_y12_s.hide();
						for(var i=0;i<sub_track.length;i++)
						{
							y12_s.append(
							$("<option></option>").val(sub_track[i].NAME).html(sub_track[i].NAME)
							);	
							
						}
					}							
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   	console.log('err: '+XMLHttpRequest.status);
				}
			});
		}

		




		//MATHS DROPDOWNS
		$.ajax
		({
		   	type: "GET",
		    url: "http://localhost:3000/firstYear",
		    dataType: "json",
		    data : {	subject : 'MATHS'
					},	
		    success: function (sub_track)
		    {
				//console.log("sub_track"+JSON.stringify(sub_track));
				div_y9_s = $("#div_y9_sMATHS");
				var y9_s = $("#y9_sMATHS");
				//sub_track.length = 0;
				if(sub_track.length == 0)
				{
					console.log("No data for 9th grade");
					
					div_y9_s.val("SUBJECT NOT AVAILABLE").attr('readonly','readonly');
					div_y9_s.show();
					show_10Maths();					
				}
				else if(sub_track[0].MANDATORY == 'YES')
				{
					//y_s = $("#y"+mandatory_courses[i].LGRADE+"_s"+mandatory_courses[i].SUBJECT);
										
					y9_s.append(
					$("<option></option>").val(sub_track[0].NAME).html(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME)
					);

					y9_s.prop('selectedIndex',1);
					//y_s.attr('hidden','hidden');

					div_y9_s.val(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME).attr('readonly','readonly');
					div_y9_s.show();
					show_10Maths();			
					
				}
				else
				{
					div_y9_s.hide();
					for(var i=0;i<sub_track.length;i++)
					{
						y9_s.append(
						$("<option></option>").val(sub_track[i].NAME).html(sub_track[i].COURSE_ID+" - "+sub_track[i].NAME)
						);	
						
					}
				}					
	        },
	        error: function(XMLHttpRequest, textStatus, errorThrown)
	        {
	          	console.log('err: '+XMLHttpRequest.status);
	        }
		});
	

		$("#y9_sMATHS").change(function()
		{
			show_10Maths();
		})

		function show_10Maths()
		{
			var arr = [];
			for(var i=9;i<10;i++)
			{
				arr.push($('#y'+i+'_sMATHS').val());
			}


			$.ajax
			({
				type: "GET",
				url: "http://localhost:3000/toFillDataInCell",
				dataType: "json",
				/*data : { data1 : $('#y9_sMATHS').val(),
							grade : 10
						},*/
				data : { data : arr,
						 subject : 'MATHS'
					   },						
				success: function (sub_track)
				{
					console.log("grade 10 subjects : " + JSON.stringify(sub_track));
					var div_y10_s = $("#div_y10_sMATHS");
					var y10_s = $("#y10_sMATHS");
					y10_s.children("option").not(':first').remove();
					$("#y11_sMATHS").children("option").not(':first').remove();
					$("#y12_sMATHS").children("option").not(':first').remove();
					$("#div_y10_sMATHS").hide();
					$("#div_y11_sMATHS").hide();
					$("#div_y12_sMATHS").hide();
					//console.log($("#y9_sMATHS").val());
					if(sub_track.length == 0)
					{
						console.log("No data for 10th grade");
						
						div_y10_s.val("SUBJECT NOT AVAILABLE").attr('readonly','readonly');
						div_y10_s.show();
						show_11Maths();					
					}
					else if(sub_track[0].MANDATORY == 'YES')
					{
						//y_s = $("#y"+mandatory_courses[i].LGRADE+"_s"+mandatory_courses[i].SUBJECT);
												
						y10_s.append(
						$("<option></option>").val(sub_track[0].NAME).html(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME)
						);

						y10_s.prop('selectedIndex',1);
						//y_s.attr('hidden','hidden');

						div_y10_s.val(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME).attr('readonly','readonly');
						div_y10_s.show();
						show_11Maths();			
						
					}
					else
					{
						div_y10_s.hide();
						for(var i=0;i<sub_track.length;i++)
						{
							y10_s.append(
							$("<option></option>").val(sub_track[i].NAME).html(sub_track[i].COURSE_ID+" - "+sub_track[i].NAME)
							);							
						}
					}							
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
					console.log('err: '+XMLHttpRequest.status);
				}
			});
		}

		$("#y10_sMATHS").change(function()
		{
			show_11Maths();
		});

		function show_11Maths()
		{
			var arr = [];
			for(var i=9;i<11;i++)
			{
				arr.push($('#y'+i+'_sMATHS').val());
			}

			console.log("try arr : "+arr);

			$.ajax
			({
			  	type: "GET",
			    url: "http://localhost:3000/toFillDataInCell",
			    dataType: "json",
			    /*data : { data1 : $('#y9_sMATHS').val(),
			    		 data2 : $('#y10_sMATHS').val(),	
			    		 grade : 11
						},*/
				data : { data : arr,
						 grade : 11,
						 subject : 'MATHS'
					   },
				success: function (sub_track)
				{
					console.log("grade 11 subjects : " + JSON.stringify(sub_track));
					var div_y11_s = $("#div_y11_sMATHS");
					var y11_s = $("#y11_sMATHS");
					y11_s.children("option").not(':first').remove();
					$("#y12_sMATHS").children("option").not(':first').remove();
					$("#div_y11_sMATHS").hide();
					$("#div_y12_sMATHS").hide();
					
					if(sub_track.length == 0)
					{
						console.log("No data for 11th grade");
						
						div_y11_s.val("SUBJECT NOT AVAILABLE").attr('readonly','readonly');
						div_y11_s.show();
						show_12Maths();					
					}
					else if(sub_track[0].MANDATORY == 'YES')
					{
						//y_s = $("#y"+mandatory_courses[i].LGRADE+"_s"+mandatory_courses[i].SUBJECT);
												
						y11_s.append(
						$("<option></option>").val(sub_track[0].NAME).html(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME)
						);

						y11_s.prop('selectedIndex',1);
						//y_s.attr('hidden','hidden');

						div_y11_s.val(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME).attr('readonly','readonly');
						div_y11_s.show();
						show_12Maths();			
						
					}
					else
					{
						div_y11_s.hide();
						for(var i=0;i<sub_track.length;i++)
						{
							y11_s.append(
							$("<option></option>").val(sub_track[i].NAME).html(sub_track[i].COURSE_ID+" - "+sub_track[i].NAME)
							);	
							
						}
					}							
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   	console.log('err: '+XMLHttpRequest.status);
				}
			});
		}
		
		$("#y11_sMATHS").change(function()
		{
			show_12Maths();
		})

		function show_12Maths()
		{
			var arr = [];
			for(var i=9;i<12;i++)
			{
				arr.push($('#y'+i+'_sMATHS').val());
			}

			$.ajax
			({
			  	type: "GET",
			    url: "http://localhost:3000/toFillDataInCell",
			    dataType: "json",
			    /*data : { data1 : $('#y9_sMATHS').val(),
			    		 data2 : $('#y10_sMATHS').val(),
			    		 data3 : $('#y11_sMATHS').val()	,
			    		 grade : 12
						},*/
				data : { data : arr,
					     grade : 12,
					     subject : 'MATHS',
					   },		
				success: function (sub_track)
				{
					console.log("grade 12 subjects : " + JSON.stringify(sub_track));
					var div_y12_s = $("#div_y12_sMATHS");
					var y12_s = $("#y12_sMATHS");
					y12_s.children("option").not(':first').remove();
					$("#div_y12_sMATHS").hide();

					if(sub_track.length == 0)
					{
						console.log("No data for 12th grade");
						
						div_y12_s.val("SUBJECT NOT AVAILABLE").attr('readonly','readonly');
						div_y12_s.show();
						//show_10Maths();					
					}
					else if(sub_track[0].MANDATORY == 'YES')
					{
						//y_s = $("#y"+mandatory_courses[i].LGRADE+"_s"+mandatory_courses[i].SUBJECT);
												
						y12_s.append(
						$("<option></option>").val(sub_track[0].NAME).html(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME)
						);

						y12_s.prop('selectedIndex',1);
						//y_s.attr('hidden','hidden');

						div_y12_s.val(sub_track[0].COURSE_ID+" - "+sub_track[0].NAME).attr('readonly','readonly');
						div_y12_s.show();
						//show_10Maths();			
						
					}
					else
					{
						div_y12_s.hide();
						for(var i=0;i<sub_track.length;i++)
						{
							y12_s.append(
							$("<option></option>").val(sub_track[i].NAME).html(sub_track[i].COURSE_ID+" - "+sub_track[i].NAME)
							);	
							
						}
					}							
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   	console.log('err: '+XMLHttpRequest.status);
				}
			});
		}
	}