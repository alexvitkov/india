<?php 
require_once "configuration.php";
require_once "user.php";
require_once "misc.php";

/*handles database stuff*/
	class Database
	{
		private $pdo;


		public function __construct()
		{
			global $domain_name;
			global $database_name;
			global $database_username;
			global $database_password;
			global $database_location;
			try
			{
				$this->pdo=new PDO("mysql:dbname={$database_name};host={$database_location}",$database_username,$database_password);
			}catch(PDOException $e)
			{
				error_log("Could not get database {$database_name} from {$database_location}, {$e} ");
				die("The cow bought the farm");
			}
		}

		/*returns false if this isn't a user, otherwise returns the user*/
		function get_user(string $user) 
		{
			$ret=new User;

			$prep=$this->pdo->prepare("select user_id,username,email from users where username=:username");
			$prep->bindParam(':username',$user);

			$prep->execute();

			$hold=$prep->fetch(PDO::FETCH_ASSOC);

			if($hold)
			{
				$ret->user_id=$hold["user_id"];
				$ret->username=$hold["username"];
				$ret->email_address=$hold["email"];
				return $ret;
			}else
			{
				return false;
			}
		}
		/*returns false if this isn't a user or the password is incorrect, otherwise returns the userid*/
		function authenticate(string $user, string $password) 
		{
			$ret=new User;

			$prep=$this->pdo->prepare("select user_id,username,email,password from users where username=:username");
			$prep->bindParam(':username',$user);
			$prep->execute();

			$hold=$prep->fetch(PDO::FETCH_ASSOC);

			if($hold)
			{
				if(password_verify($password,$hold["password"]))
				{
					$ret->user_id=$hold["user_id"];
					$ret->username=$hold["username"];
					$ret->email_address=$hold["email"];
					return $ret;
				}else
				{
					return false;
				}
			}else
			{
				return false;
			}
		}
		/*returns false if username is taken, email is not checked here*/
		function register_user(string $user,string $password,string $email) : bool
		{
			$hold=$this->get_user($user);
			global $domain_name;
			global $has_email_verification;
			global $password_hash_algo;


			if($hold)
			{
				return false;
			}else
			{
				if($has_email_verification)
				{
					generate_email_verification_link();
				}else
				{
					$hashed_pass=password_hash($password,$password_hash_algo);
					$prep=$this->pdo->prepare("insert into users(username,password,email) values(:username,:password,:email)");
					$prep->bindParam(':username',$user);
					$prep->bindParam(':password',$hashed_pass);
					$prep->bindParam(':email',$email);
					$prep->execute();
				}
				return true;
			}
		}
	}


?>
