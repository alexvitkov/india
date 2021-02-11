<?php
/*should be placed outside of document root*/

$domain_name="localhost";

<<<<<<< HEAD
=======
if (file_exists("/home/alex")) {
    $database_name="alex";
    $database_username="alex";
    $database_password="lol";
    $database_location="127.0.0.1";
>>>>>>> f1cd0085cd8dba8b25818fc998d315b28e6c13a5

    $storage_root = "/home/alex/fileup_storage";
}
else {

$database_name="fileup_testing";
$database_username="outsider";
$database_password="parola123";
$database_location="localhost";

    $storage_root = "/tmp/fileup_storage";
}


$password_hash_algo=PASSWORD_BCRYPT;

$has_email_verification=false;
?>
