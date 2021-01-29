
function clear_hero_errors()
{
	let errors = document.getElementsByClassName("hero_form_error");
	let i;
	for (i = 0; i < errors.length; i++)
	{
		errors[i].hidden = true;
	}
}
function validate_hero_login_form()
{
			let username=document.forms["hero_form"]["username"].value;
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
			let username=document.forms["hero_form"]["username"].value;
			let email=document.forms["hero_form"]["email"].value;
			let password=document.forms["hero_form"]["password"].value;
			let password2=document.forms["hero_form"]["password2"].value;

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
