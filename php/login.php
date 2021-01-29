<?php
require_once "user.php";
require_once "database.php";
require_once "misc.php";

$username=$_POST["username"];
$password=$_POST["password"];
/*server side verification*/
if(gettype($username)!="string" || gettype($password)!="string")
{
	die("You didn't specify the pass or the username");
}

$database=new Database();
$user=$database->authenticate($username,$password);
if(!$user)
{
	die("Password or username is incorrect");
}

echo "Username: {$user->username}\n";
echo "Email: {$user->email_address}";


?>
