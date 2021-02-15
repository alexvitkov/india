<!DOCTYPE html>
<html>
    <head>
        <head>
            <meta charset="utf-8">
            <link rel="preconnect" href="https://fonts.gstatic.com">
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
            <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon">
            <title>shady file upload</title> <link rel="stylesheet" type="text/css" href="../css/style.css"> 
            <title>shady file upload</title> <link rel="stylesheet" type="text/css" href="../css/sharefile_style.css"> 
        </head>
    </head>
    <body>
        <form method="GET" action="<?php echo "/php/share.php"; ?>" autocomplete="off">
            <h2>Fileup</h2>
            <div class="content">
                This file is password protected.
                <input type="hidden"   name="file"     value="<?php echo $_GET["file"];?>"><br>
                <div class="h">
                    <span>Password</span>
                    <input type="password" name="password">
                </div>
                <input type="submit" value="Download">
            </div>
        </form>
    </body>
</html>
