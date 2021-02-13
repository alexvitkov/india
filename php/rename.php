<?php 
require_once "database.php";
require_once "configuration.php";
require_once "file_type_recogniser.php";
require_once "node.php";
require_once "misc.php";

session_start();

if (!isset($_POST['folder']) || !isset($_POST['old_filename']) || !isset($_POST['new_filename'])) {
	error_log("bad /php/move.php call");
	http_response_code(400);
	exit(1);
}

$folder         = $_POST["folder"];
$old_filename   = $_POST["old_filename"];
$new_filename   = $_POST["new_filename"];
$user           = $_SESSION['user_object'];
$homedir        = $user->home_directory;

$dir = get_directory($folder, $user);
if (!$dir) {
    error_log("/php/rename.php invalid directory");
	http_response_code(409);
    exit(0);
}
 
// Check if the new filename is taken in the new dir
$contents_of_dir = $database->get_links_of($dir);
foreach ($contents_of_dir as $c) {
    if ($c['name'] == $new_filename) {
        error_log("/php/rename.php failed - filename $filename taken in $new_folder");
        http_response_code(409);
        exit(0);
    }
}

// Get the file node
$file_node = null;
$contents_of_old_dir = $database->get_links_of($dir);
foreach ($contents_of_old_dir as $c) {
    if ($c['name'] == $old_filename) {
        $file_node = $c['id'];
        break;
    }
}

if ($file_node == null) {
    error_log("/php/rename.php failed - file $old_folder/$filename doesn't exist");
    http_response_code(409);
    exit(0);
}

// Update the node_link
$move = $database->pdo->prepare("
    UPDATE node_links
    SET    name         = :new_filename
    WHERE  directory_id = :dir
    AND    node_id      = :file_node
    AND    name         = :old_filename
");

$move->bindParam(':dir',           $dir);
$move->bindParam(':file_node',     $file_node);
$move->bindParam(':old_filename',  $old_filename);
$move->bindParam(':new_filename',  $new_filename);

if(!$move->execute()) {
    error_log("extremely sad shit");
    http_response_code(409);
    exit(0);
}

?>
