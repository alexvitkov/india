<?php
require_once "php/database.php";
require_once "php/misc.php";

$username=$_POST["username"];
$password=$_POST["password"];
$password2=$_POST["password2"];
$email=$_POST["email"];

/*check if we are given shady credentials*/
if(!validate_credentials($username,$email,$password,$password2))
{
	error_log("Invalid registration that has probbably bypassed client side verification. This could be an attack!");
	die();
}
$database= new Database;

if($database->register_user($username,$password,$email))
{
	echo "registered";
}else
{
	echo "didn't register";
}

?>
