<?php
	require_once "node.php";
	session_start();
	$user=$_SESSION["user_object"];

//echo '[ { "name": "file1.txt", "mimetype": "text/plain", "is_directory": false }, { "name": "file2.pdf", "mimetype": "application/pdf", "is_directory": false }, { "name": "dir", "mimetype": "", "is_directory": true } ] ';
	$ret=get_directory("/",$user);
	$json=json_encode($ret);
	echo $json;
?>