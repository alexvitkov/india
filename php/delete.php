<?php
require_once "database.php";
require_once "user.php";
require_once "node.php";

session_start();
$folder=$_POST["folder"];
$filename=$_POST["filename"];
$user=$_SESSION["user_object"];

error_log("someone is trying to delete".$filename);
unlink_from_folder($folder,$filename,$user);
error_log("someone is trying to delete".$filename);

?>
