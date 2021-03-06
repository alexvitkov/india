<?php 
require_once "database.php";
require_once "configuration.php";
require_once "file_type_recogniser.php";
require_once "node.php";
require_once "misc.php";

session_start();

if (!isset($_POST['old_folder']) || !isset($_POST['new_folder']) || !isset($_POST['filename'])) {
	error_log("bad /php/move.php call");
	http_response_code(400);
	exit(1);
}

// what the name will be in the new directory
$new_filename = $_POST["filename"];

// what the name WAS in the old directory
$old_filename = $_POST["filename"];

if (isset($_POST['new_filename']))
    $new_filename = $_POST['new_filename'];

$old_folder = $_POST["old_folder"];
$new_folder = $_POST["new_folder"];
$user       = $_SESSION['user_object'];
$homedir    = $user->home_directory;

$old_dir = get_directory($old_folder, $user);
$new_dir = get_directory($new_folder, $user);
$trash_dir = get_directory("/trash",$user);
$share_dir = get_directory("/share",$user);

function path_combine($a, $b) {
    $last_char = substr($a, -1);
    if ($last_char == "/")
        return $a . $b;
    else
        return $a . "/" . $b;
}

// We cannot move the folder '/foo' inside '/foo/bar'
{
    $old_path = path_combine($old_folder, $old_filename);

    if (substr($new_folder, 0, strlen($old_path)) == $old_path) {
        error_log("trying to move a parent directory into a subdirectory");
	    http_response_code(409);
        exit(0);
    }
}


if (!$old_dir || !$new_dir || ($old_dir==$user->home_directory && ($old_filename=="share" || $old_filename=="trash"))) {
    error_log("invalid src/dst dir");
	http_response_code(409);
    exit(0);
}
 
// Check if the filename is taken in the new dir
$contents_of_new_dir = $database->get_links_of($new_dir,$user->user_id);
foreach ($contents_of_new_dir as $c) {
    if ($c['name'] == $new_filename) {
        error_log("filename $new_filename taken in $new_folder");
        http_response_code(409);
        exit(0);
    }
}

// Get the file node
$file_node = null;
$contents_of_old_dir = $database->get_links_of($old_dir,$user->user_id);
foreach ($contents_of_old_dir as $c) {
    if ($c['name'] == $old_filename) {
        $file_node = $c['id'];
        break;
    }
}

if ($file_node == null) {
    error_log("/php/move.php failed - file $old_folder/$new_filename doesn't exist");
    http_response_code(409);
    exit(0);
}


// Update the node_link
$move = $database->pdo->prepare("
    UPDATE node_links
    SET    directory_id = :new_dir,
           name         = :new_filename
    WHERE  directory_id = :old_dir
    AND    node_id      = :file_node
    AND    name         = :old_filename
");

$move->bindParam(':new_dir',      $new_dir);
$move->bindParam(':old_dir',      $old_dir);
$move->bindParam(':file_node',    $file_node);
$move->bindParam(':old_filename', $old_filename);
$move->bindParam(':new_filename', $new_filename);

if(!$move->execute()) {
    error_log("extremely sad shit");
    http_response_code(409);
    exit(0);
}

?>
