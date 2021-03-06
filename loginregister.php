<div id="hero" class="overlay">
    <div id="arrows">
        <img src="img/arrow.svg" id="protoarrow" style="display: none">
    </div>

    <div class="vcenter">
        <p>file upload service</p>
        <p class="big">that <span class="blue">just about works</span></p>
        <p>most of the time</p>
    </div>
</div>

<div class="vcenter" id="signupform">
    <form name="register_form" action="/php/register.php" method="post" onsubmit="return validate_hero_form()">
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
    <form name="login_form" action="/php/login.php" method="post" onsubmit="return validate_hero_login_form()">
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

<script src="loginregister.js"></script>
