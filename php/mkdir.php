<?php
require_once "database.php";
require_once "user.php";
require_once "node.php";

session_start();
$parent_directory=$_POST['parent_directory'];
$dirname=$_POST['dirname'];
$user=$_SESSION['user_object'];

create_directory($parent_directory,$dirname,"",$user);


?>
