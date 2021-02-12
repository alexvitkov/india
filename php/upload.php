<?php 
require_once "database.php";
require_once "configuration.php";

echo 1;
if (!isset( $_POST["filename"]) || !isset($_FILES["the_file"]))
{
	error_log("someone tried to upload something impropperly");
	http_response_code(400);
	exit(1);
}
echo 2;

$file=$_FILES["the_file"];
$filename=$_POST["filename"];

echo 3;

$codename=$database->create_file_node($filename);
echo $codename;
if($codename=="error")
{
	error_log("could not create file_node in upload.php");
	http_response_code(400);
	exit(0);
}
move_uploaded_file($file['tmp_name'], "$storage_root/$codename");

http_response_code(200);
exit(0);
?>
