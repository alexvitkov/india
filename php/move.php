<?php 
require_once "database.php";
require_once "configuration.php";
require_once "file_type_recogniser.php";
require_once "node.php";
require_once "misc.php";

session_start();

if (!isset($_POST['old_folder']) || !isset($_POST['new_folder']) || !isset($_POST['filename'])) {
	error_log("bad /php/move.php call $_POST of:$_POST[old_folder] nf:$_POST[new_folder] fn:$_POST[filename]");
	http_response_code(400);
	exit(1);
}

$filename   = $_POST["filename"];
$old_folder = $_POST["old_folder"];
$new_folder = $_POST["new_folder"];
$user       = $_SESSION['user_object'];
$homedir    = $user->home_directory;

$old_dir = get_directory($old_folder, $user);
$new_dir = get_directory($new_folder, $user);
if (!$old_dir || !$new_dir) {
    error_log("invalid src/dst dir");
	http_response_code(409);
    exit(0);
}
 
// Check if the filename is taken in the new dir
$contents_of_new_dir = $database->get_links_of($new_dir);
foreach ($contents_of_new_dir as $c) {
    if ($c['name'] == $filename) {
        error_log("filename $filename taken in $new_folder");
        http_response_code(409);
        exit(0);
    }
}

// Get the file node
$file_node = null;
$contents_of_old_dir = $database->get_links_of($old_dir);
foreach ($contents_of_old_dir as $c) {
    if ($c['name'] == $filename) {
        $file_node = $c['id'];
        break;
    }
}

if ($file_node == null) {
    error_log("/php/move.php failed - file $old_folder/$filename doesn't exist");
    http_response_code(409);
    exit(0);
}


// Update the node_link
$move = $database->pdo->prepare("
    UPDATE node_links
    SET    directory_id = :new_dir
    WHERE  directory_id = :old_dir
    AND    node_id      = :file_node
    AND    name         = :filename
");

$move->bindParam(':new_dir',   $new_dir);
$move->bindParam(':old_dir',   $old_dir);
$move->bindParam(':file_node', $file_node);
$move->bindParam(':filename',  $filename);

if(!$move->execute()) {
    error_log("extremely sad shit");
    http_response_code(409);
    exit(0);
}

?>
