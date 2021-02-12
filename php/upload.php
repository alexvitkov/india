<?php 
require_once "database.php";
require_once "configuration.php";

if (!isset( $_POST["filename"]) || !isset($_POST["the_file"]))
{
	http_response_code(400);
	error_log("someone tried to upload something impropperly");
	exit(1);
}

$file = $_POST["the_file"];
$filename= $_POST["filename"];


$codename=create_file_node($filename);

copy($file['tmp_name'], "$storage_root/$codename");

echo $codename;
?>
