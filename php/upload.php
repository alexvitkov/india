<?php 

if (!array_key_exists('uf', $_FILES)) {
	http_response_code(400);
	exit();
}

$file = $_FILES['uf'];


if (file['error'] != 0) {
	http_response_code(400);
	exit();
}

$m = md5_file($file['tmp_name']);

copy($file['tmp_name'], "screen/$m.png");

echo "http://india.fmi.fail/screen/$m.png";

?>
