<?php 
require_once "database.php";
require_once "configuration.php";

if (!isset( $_POST["filename"]) || !isset($_FILES["the_file"]))
{
	http_response_code(400);
	error_log("someone tried to upload something impropperly");
	exit(1);
}

$file = $_FILES["the_file"];
$filename= $_POST["filename"];


$codename=$database->create_file_node($filename);
if($codename=="error")
{
	http_response_code(400);
	exit(0);
}
error_log($file['tmp_name']);
move_uploaded_file($file['tmp_name'], "$storage_root/$codename");

http_response_code(200);
exit(0);
?>
