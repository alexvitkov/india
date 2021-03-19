<?php
    require_once "php/user.php";
    session_start();
?>
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <link rel="preconnect" href="https://fonts.gstatic.com">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
        <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon">
        <title>shady file upload</title> <link rel="stylesheet" type="text/css" href="style.css"> 
    </head>

    <body>
        <div class="overlay" style="height: 100%;">
            <div class="vert2">
                <div id="header">
                    <p class="logo">shady_file_upload</p>

                    <div style="flex: 1 0 0;"></div>
                    <ul id="topmenu">

                    <?php if (array_key_exists("user_object", $_SESSION)) { ?>
                        
                        <li>
			<?php 
				$user=$_SESSION['user_object'];
				error_log($user->username);
				echo $user->username;
			?>
				</li>
                        <li onclick="window.location.href='/php/logout.php'">Sign out</li>

                    <?php } else {?>

                        <li onclick="showLogin(false)">Sign up</li>
                        <li onclick="showLogin(true)">Log in</li>

                    <?php }?>
                    </ul>

                </div>

                <div id="page">

<?php
    if (array_key_exists("user_object", $_SESSION)) {
        require_once("loggedin.php");
    } else {
        require_once("loginregister.php");
    }
?>

                </div>
            </div>
            <img src="img/bottom.svg" class="bgbottom">
        </div>
    </body>
<html>
