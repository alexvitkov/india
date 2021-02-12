arrows = [];

const minSpeed = 3;
const maxSpeed = 8;
const delay = 1500;
const lifetime = 20000;

function make_arrow() {
	const svg = document.getElementById("protoarrow").cloneNode();
	svg.style.left = Math.random() * 100 + '%';
	svg.style.display = 'block';
	document.getElementById('arrows').append(svg);
	const ob = {
		y: -800, 
		svg: svg, 
		speed: Math.random() * (maxSpeed - minSpeed) + minSpeed
	};
	arrows.push(ob);
	setTimeout(make_arrow, delay);
	setTimeout(() => {
		svg.remove();
		arrows.shift();
	}, lifetime);
}

function update() {
	for (const arrow of arrows) {
		arrow.y += arrow.speed;
		arrow.svg.style.bottom = arrow.y + 'px';
	}
	
	window.requestAnimationFrame(update);
}

make_arrow();
update();



function clear_hero_errors()
{
	let errors = document.getElementsByClassName("hero_form_error");
	for (let i = 0; i < errors.length; i++)
	{
		errors[i].hidden = true;
	}
}
function validate_hero_login_form()
{
			let username=document.forms["login_form"]["username"].value;
			let flag=true;
			clear_hero_errors();

			if(username.length==0)
			{
				document.getElementById("username-length-error").hidden=false;
				flag=false;
			}
			document.activeElement.blur();
			return flag;
}
function validate_hero_form()
{
			let username=document.forms["register_form"]["username"].value;
			let email=document.forms["register_form"]["email"].value;
			let password=document.forms["register_form"]["password"].value;
			let password2=document.forms["register_form"]["password2"].value;

			let flag=true;
			clear_hero_errors();

			if(username.length==0)
			{
				document.getElementById("username-length-error").hidden=false;
				flag=false;
			}
			if(!email.match(/\S+@\S+/))
			{
				document.getElementById("email-error").hidden=false;
				flag=false;
			}
			if(password.length==0)
			{
				document.getElementById("password-length-error").hidden=false;
				flag=false;
			}
			if(password !== password2)
			{
				document.getElementById("password-match-error").hidden=false;
				flag=false;
			}
			document.activeElement.blur();
			return flag;

}

function showLogin(l) {
    document.getElementById("loginform").style.display = l ? "flex" : "none";
    document.getElementById("signupform").style.display = l ? "none" : "flex";
}
