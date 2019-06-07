$(document).ready(function()
{
	$("#username").prop('readonly',true);
	$("#name").prop('readonly',true);
	$("#password").prop('readonly',true);
	$("#email").prop('readonly',true);
	
	

	var username = $("#username").val();
	var name = $("#name").val();
	var email = $("#email").val();
	
	$('#username_edit').click(function()
	{
		
		var n_edit = $('#username_edit').html();

		if(n_edit === "edit")
		{
			$("#username").prop('readonly', false);
			$("#username").val('').val(username).focus();
			$('#username_edit').html("cancel");						
		}		 
		else if(n_edit === "cancel")
		{
				$("#username").val(username);
				$("#username").prop('readonly', true);
				$('#username_edit').html("edit");
				$("#username_message").attr("hidden",true);
		}
	});	
	

	$('#email_edit').click(function()
	{
		
		var n_edit = $('#email_edit').html();

		if(n_edit === "edit")
		{
			$("#email").prop('readonly', false);
			$("#email").val('').val(email).focus();
			$('#email_edit').html("cancel");						
		}		 
		else if(n_edit === "cancel")
		{
				$("#email").val(email);
				$("#email").prop('readonly', true);
				$('#email_edit').html("edit");
		}
	});

	$("#validate").click(function()
	{
		var newusername = $("#username").val();
		//email = $("#email").val();

		if(username == "")
		{
			alert("Enter all fields");
		}
		else if(username == newusername)
		{
			alert("No change");
		}
		else
		{
			//console.log(" username: "+ username +"\n email: "+ email);	
			
			alert("Submittig form");  //get acknowledgment from server before displaying this message;
 			$("#submit").click();			
		}				
	});

	$("#cancel_btn").click(function()
	{
		window.history.back();
	})
});




	

