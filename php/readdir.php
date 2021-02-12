<?php
	require_once "node.php";
	session_start();
	$user=$_SESSION['user_object'];
	$path=$_POST['path'];

	$ret=get_directory_contents($path,$user);

	$json=json_encode($ret);
	echo $json;
?>
