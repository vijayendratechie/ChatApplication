
$(document).ready(function()
{
	var socket = io.connect("https://testchaatapp.herokuapp.com");	
	var message,tempMessages,savedMessages,chatMessages,sendtoflag,onlineusers;

	var username = $("#username").html();
	username = username.trim();
	var notification = {};

	function messagefocus()
	{
		$("#message").focus();
	}

	messagefocus();

	function sendmsg(username)
	{
		//alert(username);
		message = $("#message").val();
		$("#message").val("");
		sendtoflag = $("#send").attr("name");
		//alert("send clicled"+sendtoflag);
		if(sendtoflag == "default")
		{
			if(message != "")
			{
				socket.emit("chat",{message : message,sender : username});	
			}	
		}
		else
		{
			if(message != "")
			{
				socket.emit("private_chat",{message : message,sender : username,receiver : sendtoflag});
				chatMessages = $(".output").html()
				$(".output").html(chatMessages+"<p><strong>"+username+" : </strong>"+message+"</p>");
			}
		}
	}

	$(this).keypress(function(event)
	{
		if (event.keyCode === 13)
		{
		   event.preventDefault();
		   sendmsg(username);
		}
	});

		
	$("#send").click(function()
	{
		sendmsg(username);				
	})

	socket.on("chat",function(data)
	{	
		console.log("Received message : "+ JSON.stringify(data));
		chatMessages = $(".output").html()
		$(".output").html(chatMessages+"<p><strong>"+data.sender+" : </strong>"+data.message+"</p>");
	});

	socket.on("private_chat",function(data)
	{
		console.log("Privately Received message : "+ JSON.stringify(data));
		if($("#chat-room").attr("name") == data.sender)
		{			
			chatMessages = $(".output").html();
			$(".output").html(chatMessages+"<p><strong>"+data.sender+" : </strong>"+data.message+"</p>");	
		}
		else
		{
			//$("#"+data.sender.trim()).find("div").html("*");
			
			tempMessages="<p><strong>"+data.sender+" : </strong>"+data.message+"</p>";
			//console.log("chat messages : "+JSON.stringify(tempMessages));
			if(notification.hasOwnProperty(data.sender))
			{
				savedMessages = notification[data.sender];	
				//console.log("message in object key : "+JSON.stringify(savedMessages));
				savedMessages=savedMessages+tempMessages;
				notification[data.sender] = savedMessages;
				//console.log("updated message in object key : "+JSON.stringify(notification[data.sender]));
			}		
			else
			{
				notification[data.sender] = tempMessages;
				//console.log("saved in object 1 : "+JSON.stringify(notification[data.sender]));
			}
			create_notification();				 
		}
	}) 	

	function create_notification()
	{
		Object.keys(notification).forEach(function(key)
		{
			$("#"+key.trim()).find("div").html("*");
		})
	}


	socket.emit("username",username);

	socket.on("onlineusers",function(onlineusers)
	{
		var flag = 0;
		if(onlineusers.length == 1)
		{
			$(".list-group").empty();
			$(".list-group").html("<li class='list-group-item'>No online users</li>");
			$("#chat-username").html("<h4 id='chat-room' name='chat-room'>YOU are in a chat room</h4>");
			$("#send").attr("name","default");
			notification = {};
		}
		else
		{
			$(".list-group").empty();
			var tryid,keyarray;
			keyarray = Object.keys(notification);
			console.log("onlineusers : "+JSON.stringify(onlineusers));
			console.log("keyarray :  "+JSON.stringify(keyarray));

			for(let i=0;i<keyarray.length;i++)
			{
				var check_flag=0;
				for(let j=0;j<onlineusers.length;j++)
				{
					if(keyarray[i] == onlineusers[j])
					{
						check_flag = 1;
						break;
					}
				}

				if(check_flag == 0)
				{
					delete notification[keyarray[i]];
					console.log("object contains : "+JSON.stringify(notification));
				}	
			}


			for(let i=0;i<onlineusers.length;i++)
			{
				if(onlineusers[i]!=username)
				{
					uniqueid = onlineusers[i];
					//console.log("online users:"+tryid);

					//numberofonlineusers=numberofonlineusers+"<li class='list-group-item'><button class='btn btn-link'>"+onlineusers[i]+"</button></li>";	
					$(".list-group").append("<li class='list-group-item' id='"+uniqueid+"'><button class='btn btn-link'>"+onlineusers[i]+"</button><div style='float:right'></div></li>")		
					create_notification();
				}

				if(onlineusers[i] == $("#chat-room").attr("name"))
				{
					flag=1;
				}				
			}
			if(flag==0 && $("#chat-room").attr("name") != "chat-room")
			{
				$(".output").empty();
				$("#chat-username").html("<h4 id='chat-room' name='chat-room'>User went offline.YOU are in a chat room</h4>");		
				$("#send").attr("name","default");
			}			
		}

		$(".list-group-item button").click(function()
		{
			//alert($(this).html());
			$("#"+$(this).html().trim()).find("div").empty();
			$(".output").empty();
			$("#chat-username").html("<h4 id='chat-room' name='"+$(this).html()+"'>YOU are in a private chat with "+$(this).html()+"</h4>");
			$("#send").attr("name",$(this).html());

			messagefocus();
			//$("#kuku").find("div").html();
			if(notification.hasOwnProperty($(this).html()))
			{
				tempMessages = notification[$(this).html()];
				$(".output").html(tempMessages);
				//console.log("Temp messages : "+JSON.stringify(tempMessages));
				delete notification[$(this).html()];								
			}
		});			
	});		
});
