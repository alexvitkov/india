
function clear_hero_errors()
{
	var errors = document.getElementsByClassName("hero_form_error");
	var i;
	for (i = 0; i < errors.length; i++)
	{
		errors[i].hidden = true;
	}
}
function validate_hero_form()
{
			var username=document.forms["hero_form"]["username"].value;
			var email=document.forms["hero_form"]["email"].value;
			var password=document.forms["hero_form"]["password"].value;
			var password2=document.forms["hero_form"]["password2"].value;

			var flag=true;
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
			if(password !== password2)
			{
				document.getElementById("password-error").hidden=false;
				flag=false;
			}

			if(flag)
			{
				document.getElementById("success").hidden=false;
			}
			return flag;

}
