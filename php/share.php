<?php
require_once "configuration.php";
require_once "database.php";
require_once "user.php";

session_start();



if($_SERVER["REQUEST_METHOD"] == "POST")
{
	if(!isset($_SESSION['user_object']) || !isset($_POST["folder"]) || !isset($_POST["filename"]) || !isset($_POST["users"]) || !isset($_POST["password"]) || !isset($_POST["permissions"]) )
	{
		error_log("things are not set quite right");
		http_response_code(409);
		exit(0);
	}
	$user=$_SESSION['user_object'];
	$path=$_POST["folder"];
	/*this could be a directory as well*/
	$filename=$_POST["filename"];
	$users=$_POST["users"];
	$password=$_POST["password"];
	$permissions=$_POST["permissions"];


	if($permissions==1)
	{
		$can_read=true;
		$can_write=false;
	}else if($permissions==3)
	{
		$can_read=true;
		$can_write=true;
	}
	else
	{
		http_response_code(409);
		error_log("someone gave wrong premmissions =".$permissions."! This could be an attack");
		exit(1);
	}

	error_log("someone is sharing ".$filename." with ".$users);
	$share_link=create_share_link($path,$filename,$password,$user,$can_read,$can_write,$users);
	//$share_link=create_share_link($path,$filename,$password,$user,true,true);


	if($share_link==NULL)
	{
		http_response_code(409);
	}
	echo $share_link;
	http_response_code(200);
	exit(0);
}else if($_SERVER["REQUEST_METHOD"]== "GET")
{
	if(!isset($_GET["file"]))
	{
		http_response_code(409);
		exit(0);
	}
	$code=$_GET["file"];
	if(isset($_GET["password"]))
	{
		$password=$_GET["password"];
	}else
	{
		$password="";
	}

	$shared_node=$database->get_shared_node($code);
	if($shared_node==NULL)
	{
		http_response_code(409);
		exit(0);
	}
    if ($shared_node->password!=$password) {
        if ($password == "") 
        {
            require_once("../share_frontend.php");
            exit(0);
        }else 
        {
            echo "Invalid password";
		    http_response_code(409);
		    exit(0);
        }
    }
	if(isset($_SESSION["user_object"]))
	{
		$user=$_SESSION["user_object"];
		$permissions=$database->get_permissions($shared_node->node_id,$user->user_id);
		if($permissions["can_view"]==true)
		{
			$node=$database->get_node($shared_node->node_id);
			if($node->is_directory)
			{
				/*spooky stuff here*/
				http_response_code(409);
				exit(1);
			}else
			{
				header("Content-type: $node->type");
				readfile("$storage_root/$node->code");
			}
		}
	}else
	{
		if($shared_node->is_public==true)
		{
			$node=$database->get_node($shared_node->node_id);
			if($node->is_directory)
			{
				/*spooky stuff here*/
				http_response_code(409);
				exit(1);
			}else
			{
				header("Content-type: $node->type");
				readfile("$storage_root/$node->code");
			}
		}else
		{
			http_response_code(409);
			exit(1);
		}
	}




}else
{
	http_response_code(409);
	exit(0);
}
?>
