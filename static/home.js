$(document).ready(function()
{
	var socket = io.connect("http://localhost:3000");
	var message,chatMessages;

	var username = $("#username").html();
	

	$("#send").click(function()
	{
		message = $("#message").val();
		$("#message").val("");
		socket.emit("chat",{message : message});
	})

	socket.on("chat",function(data)
	{
		//console.log("Received message : "+ JSON.stringify(data));
		chatMessages = $("#output").html()
		$("#output").html(chatMessages+"<p>"+data.message+"</p>");
	});

	socket.emit("username",username);

	socket.on("onlineusers",function(onlineusers)
	{
		//console.log("online users : "+JSON.stringify(onlineusers));
		var numberofonlineusers;
		if(onlineusers.length == 1)
		{
			$(".list-group").html("<a href='#' class='list-group-item list-group-item-action'>No online user</a>")
		}
		else
		{
			for(let i=0;i<onlineusers.length;i++)
			{
				if(onlineusers[i]!=username)
				{
					numberofonlineusers=numberofonlineusers+$(".list-group").html("<a href='#' class='list-group-item list-group-item-action'>"+onlineusers[i]+"</a>");	
				}
						
			}	
		}		
	});	
});

