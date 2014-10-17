function login(){
    var form = document.getElementById("login_form");
    var user = {
	'username': form.elements[0].value,
	'password': form.elements[1].value
    }
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4)
	    alert(xmlhttp.responseText);
    }
    xmlhttp.open("POST", "login", true);
    xmlhttp.send(JSON.stringify(user));
}

function register(user, pass){
    var form = document.getElementById("register_form");
    var user = {
	'username': form.elements[0].value,
	'password': form.elements[1].value
    }
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4)
	    alert(xmlhttp.responseText);
    }
    xmlhttp.open("POST", "register", true);
    xmlhttp.send(JSON.stringify(user));
}
