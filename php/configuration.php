<?php
/*should be placed outside of document root*/

$domain_name="localhost";

if (file_exists("/home/alex")) {
    $database_name="alex";
    $database_username="alex";
    $database_password="lol";
    $database_location="127.0.0.1";

    $storage_root = "/home/alex/fileup_storage";
}
else {
    $database_name="adam";
    $database_username="adam";
    $database_password="asdfd";
    $database_location="127.0.0.1";

    $storage_root = "/home/adam/fileup_storage";
}


$password_hash_algo=PASSWORD_BCRYPT;

$has_email_verification=false;
?>
