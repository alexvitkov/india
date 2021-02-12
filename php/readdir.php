<?php
	require_once "node.php";
	session_start();
	$user=$_SESSION["user_object"];

//echo '[ { "name": "file1.txt", "mimetype": "text/plain", "is_directory": false }, { "name": "file2.pdf", "mimetype": "application/pdf", "is_directory": false }, { "name": "dir", "mimetype": "", "is_directory": true } ] ';
	echo get_directory("/",$user);
	error_log(print_r(get_directory("/",$user)).gettype(get_directory("/",$user)));
?>
