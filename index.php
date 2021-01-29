<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>shady file upload</title> <link rel="stylesheet" type="text/css" href="css/style.css"> 
    </head>

    <body>
        <div class="overlay" style="height: 100%;">
            <div class="vert2">
                <div id="header">
                    <p class="logo">shady_file_upload</p>
                </div>

                <div id="page">


<?php
    session_start();
    if (array_key_exists("username", $_SESSION)) {
        echo "Welcome, $_SESSION[username]"; 
?>

<a href="/php/logout.php">Log out</a>

<?php
    }
    else {
        require_once("loginregister.html");
    }
?>

                </div>
            </div>
            <img src="svg/bottom.svg" class="bgbottom">
        </div>
        <script src="main.js"></script>
    </body>
<html>
