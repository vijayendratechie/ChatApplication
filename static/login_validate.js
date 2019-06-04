$(document).ready(function()
{
	$("#OTPsubmit").click(function()
	{
		if($("#OTP").val() == "")
		{
			alert("Please Enter OTP");
		}
		else
		{
			var OTP = $("#OTP").val();
			var email = $("#email").val();
			$.ajax({
	        type: "POST",
	        url: "https://testchaatapp.herokuapp.com/checkotp",
	        data: {otp : OTP, email : email},
	        dataType: "json",
	        success: function (data)
	        {     
	        	$("#error").prop("hidden",true);           
				$("#emailmessage").prop("hidden",true);
				console.log("data : "+JSON.stringify(data.status));
				if(data.status == 1)
				{
					$('#modalMessage').html("Enter New Password");
					$('#OTPbody').prop('hidden',true);
					$('#passwordbody').prop('hidden',false);
				}
				else if(data.status == 2)
				{
					$('#modalMessage').html("OTP Expired. Please regenerate new one");	
				}	
				else if(data.status == 0)
				{
					$('#modalMessage').html("Incorrect OTP");
				}		        	
	        },
	        error: function(XMLHttpRequest, textStatus, errorThrown)
	        {
	            console.log('err: '+XMLHttpRequest.status);
	        }
	        });
		}
	})

	$("#passwordvalidate").click(function()
	{
		var newpassword = $("#newpassword").val();
		var confirmpassword = $("#confirmpassword").val();
		var email = $("#email").val();

		if(newpassword == "" || confirmpassword == "")
		{
			alert("Please enter all fields");
		}
		else if(newpassword != confirmpassword)
		{
			alert("password didnot match");
		}
		else
		{			
			$.ajax({
	        type: "POST",
	        url: "https://testchaatapp.herokuapp.com/resetpassword",
	        data: {newpassword : newpassword,email : email},
	        dataType: "json",
	        success: function (data)
	        {     
	        	//console.log("data after password save is : "+)        	
	        	$("#emailmessage").html("Please login with new password");
	        	$("#emailmessage").prop("hidden",false);
	        	$("#myModal").modal('hide');
	        },
	        error: function(XMLHttpRequest, textStatus, errorThrown)
	        {
	            console.log('err: '+XMLHttpRequest.status);
	        }
	        });
		} 
	})
});

function checkusername(data)
{
	//console.log(data);
	var email = $("#email").val();
	if(email == "")
	{
		//console.log("hello1");
		$("#error").prop("hidden",true);
		$("#emailmessage").html("Enter email");
		$("#emailmessage").prop("hidden",false);			
	}
	else
	{
		$.ajax({
        type: "POST",
        url: "https://testchaatapp.herokuapp.com/checkemail",
        data: {email : email,flag : data},
        dataType: "json",
        success: function (data)
        {     
        	$("#error").prop("hidden",true);           
			//console.log("data : "+ 	typeof data.message);
			if(!isNaN(data.message))
			{
				var timer = data.message; 
				$("#emailmessage").prop("hidden",true);
				$("#passwordModal").click();
				$("#modalMessage").html("Please enter OTP sent to registered mail address.");
				timmer(timer); // Countdown timmer function				
			}
			else
			{
				$("#emailmessage").html(data.message);	        		
				$("#emailmessage").prop("hidden",false);
			}        	
        },
        error: function(XMLHttpRequest, textStatus, errorThrown)
        {
            console.log('err: '+XMLHttpRequest.status);
        }
        });
	}
}

function timmer(timer)
{ 
	//console.log(Math.floor((timer - Date.now())/1000));
	var distance = Math.floor((timer - Date.now())/1000);
	var x=setInterval(function()
	{
		console.log(distance);
		distance=distance-10;	  
		if (distance < 0)
		{
	    	clearInterval(x);
	   		// document.getElementById("demo").innerHTML = "EXPIRED";
	  		console.log("Expired");
	  	}	  
	}, 1000);
}


function login_valid()
{
	var email = $("#email").val();
	var password = $("#password").val();


	if(email == "" || password == "")
	{
		alert("Fill all fields");
	}
	else
	{
		$("#submit").click();
	}
}