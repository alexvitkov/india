<?php
require_once "configuration.php";
require_once "database.php";
require_once "user.php";
session_start();

$user=$_SESSION['user_object'];


if($_SERVER["REQUEST_METHOD"] == "POST")
{
	$path=$_POST["folder"];
	/*this could be a directory as well*/
	$filename=$_POST["filename"];
	$users=$_POST["users"];
	$password=$_POST["password"];
	$premissions=$_POST["premissions"];

	if($premissions==1)
	{
		$can_read=true;
		$can_write=false;
	}else if($premissions==3)
	{
		$can_read=true;
		$can_write=true;
	}
	else
	{
//		http_response_code(409);
		error_log("someone gave wrong premmissions =".$premissions."! This could be an attack");
//		exit(1);
	}

	//$share_link=create_share_link($path,$filename,$password,$user,$can_read,$can_write);
	$share_link=create_share_link($path,$filename,$password,$user,true,true);


	if($share_link==NULL)
	{
		http_response_code(409);
	}
	echo $share_link;
	http_response_code(200);
	exit(0);
}else if($_SERVER["REQUEST_METHOD"]== "GET")
{
	$code=$_GET["code"];
	$file_id=$database->get_node_with_code($code);
	if($file_id==NULL)
	{
		http_response_code(409);
		exit(0);
	}
	$premissions=$database->get_premissions($file_id,$user->user_id);
	if($premissions["can_view"]==true)
	{
		$node=$database->get_node($file_id);
		if($node->is_directory)
		{
			/*spooky stuff here*/
			http_response_code(409);
			exit(1);
		}else
		{
			header("Content-type: $node[type]");
			readfile("$storage_root/$node[code]");
		}
	}



}else
{
	http_response_code(409);
	exit(0);
}
?>
