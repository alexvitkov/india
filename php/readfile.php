<?php 
require_once "database.php";
require_once "configuration.php";
require_once "file_type_recogniser.php";
require_once "node.php";
require_once "misc.php";

session_start();
if (!isset($_POST["filename"]) || !isset($_FILES["folder"])) {
	error_log("/php/readfile.php - invalid request");
	http_response_code(400);
	exit(1);
}

$user     = $_SESSION['user_object'];
$homedir  = $user->home_directory;
$folder   = $_POST["folder"];
$filename = $_POST["filename"];

$dir = get_directory($folder, $user);
if (!$dir) {
    error_log("i/php/readfile.php - invalid directory");
	http_response_code(409);
    exit(0);
}

$contents_of_dir = $database->get_links_of($dir);
$file_node = null;

foreach ($contents_of_dir as $c) {
    if ($c['name'] == $filename) {
        $file_node = $c;
    }
}

var_error_log($file_node);
