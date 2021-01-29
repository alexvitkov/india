<?php
require_once "user.php";

function generate_email_verification_link()
{
	/*TODO*/
	$url="{$domain_name}/register/"+random_bytes(20);
	mail($email,"Registration at ${domain_name}","Click here to register {$url}.");
}



?>
