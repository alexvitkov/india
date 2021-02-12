<?php 
require_once "database.php";
require_once "configuration.php";
require_once "file_type_recogniser.php";
require_once "node.php";

session_start();
if (!isset( $_POST["filename"]) || !isset($_FILES["the_file"]) || !isset($_POST['parent_directory']))
{
	error_log("someone tried to upload something impropperly");
	http_response_code(400);
	exit(1);
}

$file=$_FILES["the_file"];
$filename=$_POST["filename"];
$parent_directory=$_POST["parent_directory"];
$user=$_SESSION['user_object'];
$homedir=$user->home_directory;
$mimetype=file_type($file['tmp_name']);

$dir = get_directory($parent_directory, $user);
if (!$dir) 
{
    error_log("trying to upload to invalid directory");
	http_response_code(409);
    exit(0);
}

$codename=$database->create_file_node($filename,"",$dir,$mimetype,$user);
if($codename=="error")
{
	error_log("could not create file_node in upload.php");
	http_response_code(409);
	exit(0);
}
if($codename=="filename taken")
{
	http_response_code(409);
	exit(0);
}
move_uploaded_file($file['tmp_name'], "$storage_root/$codename");

http_response_code(200);
exit(0);
?>
