<?php
require_once "user.php";

function generate_email_verification_link()
{
	/*TODO*/
	$url="{$domain_name}/register/"+random_bytes(20);
	mail($email,"Registration at ${domain_name}","Click here to register {$url}.");
}


function var_error_log( $object=null ){
    ob_start();                    // start buffer capture
    var_dump( $object );           // dump the values
    $contents = ob_get_contents(); // put the buffer into a variable
    ob_end_clean();                // end capture
    error_log( $contents );        // log contents of the result of var_dump( $object )
}


?>
