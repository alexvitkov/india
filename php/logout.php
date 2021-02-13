<?php
// TODO
// This is dangerous and stupid
// Right now every webpage can redirect any of its users to http://shady.upload/logout
// which will log the user out of our webpage

session_start();
unset($_SESSION['user_object']);
header('Location: /');
?>
