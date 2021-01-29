<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>shady file upload</title> <link rel="stylesheet" type="text/css" href="css/style.css"> </head>

    <body>
        <div class="overlay" style="height: 100%;">
            <div class="vert2">
                <div id="header">
                    <p class="logo">shady_file_upload</p>
                </div>

                <div id="page">
                    <div id="hero" class="overlay">
                        <div id="arrows">
                            <img src="svg/arrow.svg" id="protoarrow" style="display: none">
                        </div>

                        <div class="vcenter">
                            <p>file upload service</p>
                            <p class="big">that <span class="blue">just about works</span></p>
                            <p>most of the time</p>
                        </div>
                    </div>

                    <div class="vcenter" id="signupform">
                        <form name="hero_form" action="/php/register.php" method="post" onsubmit="return validate_hero_form()">
                            <h2>Get started</h2>
                            <div class="content">
                                <p>Username</p>
                                <input type="text" id="username" name="username">
                                <p id="username-length-error" class="hero_form_error" hidden>Please specify a username</p>

                                <p>Email address</p> 
                                <input type="text" id="email" name="email">
                                <p id="email-error" class="hero_form_error" hidden>Invalid email address</p>

                                <p>Password</p>
                                <input type="password" id="password" name="password">
                                <p id="password-length-error" class="hero_form_error" hidden>Please provide a password</p>

                                <p>Repeat Password</p>
                                <input type="password" id="password2" name="password2">
                                <p id="password-match-error" class="hero_form_error" hidden>Passwords didn't match</p>
                                <input type="submit" value="Sign up">
                                <p style="font-size: 1.1em;">Already have an account? <a href="#" onclick="showLogin(true)">Log in</a>
                            </div>
                        </form>
                    </div>

                    <div class="vcenter" id="loginform">
                        <form name="hero_form" action="/php/login.php" method="post" onsubmit="return validate_hero_login_form()">
                            <h2>Login</h2>
                            <div class="content">
                                <p>Username</p>
                                <input type="text" id="username" name="username">
                                <p id="username-length-error" class="hero_form_error" hidden>Please enter a username</p>
                                <p>Password</p>
                                <input type="password" id="password" name="password">
                                <input type="submit" value="Login">
                                <p style="font-size: 1.1em;">Don't have an account? <a href="#" onclick="showLogin(false)">Sign up</a>
                            </div>
                        </form>
                    </div>


                </div>
            </div>

            <img src="svg/bottom.svg" class="bgbottom">
        </div>

        <script src="main.js"></script>

    </body>
    <html>
