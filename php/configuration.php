<?php
/*should be placed outside of document root*/

$use_https=true;

if (file_exists("/home/alex")) {
	$domain_name="localhost";
	$database_name="alex";
	$database_username="alex";
	$database_password="lol";
	$database_location="127.0.0.1";

	$storage_root = "/home/alex/fileup_storage";
}
else {
	$domain_name="testing";
	$database_name="fileup_testing";
	$database_username="outsider";
	$database_password="parola123";
	$database_location="localhost";
	/*storage root must be in the webroot*/
	$storage_root = "/srv/apache/testing/project/files/";
}

/*if we save deleted files just in case of an error*/
$has_trash=true;
$password_hash_algo=PASSWORD_BCRYPT;

$has_email_verification=false;
?>
