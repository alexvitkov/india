<?php
    session_start();
?>
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon">
        <title>shady file upload</title> <link rel="stylesheet" type="text/css" href="css/style.css"> 
    </head>

    <body>
        <div class="overlay" style="height: 100%;">
            <div class="vert2">
                <div id="header">
                    <p class="logo">shady_file_upload</p>

                    <div style="flex: 1 0 0;"></div>
                    <ul id="topmenu">

                    <?php if (array_key_exists("username", $_SESSION)) { ?>
                        
                        <li><?php echo $_SESSION['username'];?></li>
                        <li onclick="window.location.href='/php/logout.php'">Sign out</li>

                    <?php } else {?>

                        <li onclick="showLogin(false)">Sign up</li>
                        <li onclick="showLogin(true)">Log in</li>

                    <?php }?>
                    </ul>

                </div>

                <div id="page">

<?php
    if (array_key_exists("username", $_SESSION)) {
        require_once("loggedin.php");
    } else {
        require_once("loginregister.php");
    }
?>

                </div>
            </div>
            <img src="svg/bottom.svg" class="bgbottom">
        </div>
    </body>
<html>
