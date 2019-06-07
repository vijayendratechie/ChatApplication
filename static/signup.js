$(document).ready(function()
{
	var username,name,email,password;	
	checkusernameavailability();				
});

function checkusernameavailability()
{
	$("#username").focusout(function()
	{
		username = $("#username").val();
		//alert(username);
		
		if($('#username_edit').html() == "edit")
		{
			return;
		}

		if(username != "")
		{					
			username = $("#username").val();
			//alert("next entry : "+username);	
			$("#validate").attr("disabled",true);			
			$("#username_message").html("Checking for username...");
			check_username(username);					
		}
	});
}

function check_username(username)
{
	$.ajax({
    type: "GET",
    url: "https://testchaatapp.herokuapp.com/check_username",
    data: {username : username},
    dataType: "text",
    success: function (usernamestatus)
    {     
    	console.log(usernamestatus);
    	if(usernamestatus == "available")
    	{
    		$("#validate").attr("disabled",false);			
			$("#username_message").html("<font color='green'>Username available</font>");
    		$("#username_message").attr("hidden",false);
    	}
    	else if(usernamestatus == "notavailable")
    	{
    		$("#username_message").html("<font color='red'>Username not available</font>");		
    		$("#username_message").attr("hidden",false);		
    	}
    },
    error: function(XMLHttpRequest, textStatus, errorThrown)
    {
        console.log('err: '+XMLHttpRequest.status);
    }
    });
}

function signup_valid()
{
	username = $("#username").val();
	name = $("#name").val();
	email = $("#email").val();
	password = $("#password").val();


	if(username == "" || name == "" || email == "" || password == "")
	{
		alert("Fill all fields");
	}
	else
	{
		$("#submit").click();				
	}	
};

