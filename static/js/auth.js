function parseForm(form){
    var formData = {};
    for(var i = 0; i < form.elements.length; ++i){
	var elem = form.elements[i];
	if(elem.type.toLowerCase() != "button")
	    formData[elem.name] = elem.value;
    }
    return formData;
}

function login(){
    var user = parseForm(document.getElementById("login_form"));
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4)
	    alert(xmlhttp.responseText);
    }
    xmlhttp.open("POST", "login", true);
    xmlhttp.send(JSON.stringify(user));
}

function register(){
    var user = parseForm(document.getElementById("register_form"));
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
	if(xmlhttp.readyState == 4)
	    alert(xmlhttp.responseText);
    }
    xmlhttp.open("POST", "register", true);
    xmlhttp.send(JSON.stringify(user));
}
