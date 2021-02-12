<?php 
require_once "configuration.php";
require_once "user.php";
require_once "misc.php";
require_once "node.php";

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

				$this->pdo=new PDO("mysql:dbname={$database_name};host={$database_location}",$database_username,$database_password);
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
				$ret->current_directory=$hold["home_directory"];
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
		function get_home_id($user_id)
		{
			$statement=$this->pdo->prepare("select home_directory
							from users
							where user_id=:id
							");
			$statement->bindParam(':id',$user_id);

			$ret=$statement->execute(PDO::FETCH_ASSOC);
			return $ret["home_directory"];
		}
		function get_node_id($name,$directory_id)
		{
			$hold=NULL;
			$statement=NULL;
			$ret=[];
			if($name != NULL)
			{
				if($directory_id!=NULL)
				{
					$statement=$this->pdo->prepare(
						"select nl.node_id as id from node_links nl
						inner join nodes n on n.node_id=nl.node_id 
						where name=:name and directory_id=:directory_id)");
					$statement->bindParam(':name',$name);
					$statement->bindParam(':directory_id',$directory_id);
				}else
				{
					/*get all node_ids with the name name*/
					$statement=$this->pdo->prepare("select node_id as id from nodes where name=:name");
					$statement->bindParam(':name',$name);
				}
				if($statement==NULL)
				{
					error_log("statement is null");
					exit(1);
				}
			}else {
				$statement=$this->pdo->prepare("select node_id as id from node_links where directory_id=:dir_id");
					$statement->bindParam(':dir_id',$directory_id);
			}
			if($statement->execute()==false)
			{
				error_log("there is an error in the sql statement in get_node_id");
				exit(1);
			}
				
			while($hold=$statement->fetch(PDO::FETCH_ASSOC))
			{
				print_r($hold);
				array_push($ret,$hold["id"]);
			}
			return $ret;

		}
		function get_random_node_name(string $prefix)
		{
			do{
				$proposal=uniqid($prefix,true);
			}while($this->get_node_id($proposal,NULL)!=NULL);
			return $proposal;
		}
		/*returns NULL if node doesn't exist*/
		/*if name is NULL return all node ids in the directory*/
		/*if directory is NULL return all node ids with the name name*/
		/*if both are null return NULL*/
		/*returns node id*/
		function create_dangling_directory(): int
		{
			$dir_name=$this->get_random_node_name("");
			global $storage_root;

			$prep=$this->pdo->prepare("insert into nodes(is_directory,relative_path,name) values(true,:root,:name)");
			$prep->bindParam(':name',$dir_name);
			$prep->bindParam(':root',$storage_root);
			if($prep->execute()==false)
			{
				error_log("tried to create a dangling directory but sql statement failed. Fatal error!");
				exit(1);
			}
			
			$id=$this->get_node_id($dir_name,NULL);
			if(count($id)!=1)
			{
				error_log("created a dangling directory but couldn't find it afterward. Fatal error!");
				exit(1);
			}

			//print count($id);
			return $id[0];
		}
		function are_linked(int $directory_id,int $node_id): bool
		{
			$prepare=$this->pdo->prepare("select node_id
						      from node_links
						      where node_id=:node_id and directory_id=:dir_id
						      ");
			$prepare->bindParam(':node_id',$node_id);
			$prepare->bindParam(':dir_id',$directory_id);
			if($prepare->execute()==false)
			{
				error_log("there is an sql error in are_linked");
				/*quiet error*/
				return false;
			}
			if(count($prepare->fetch(PDO::FETCH_ASSOC))==1)
			{
				return true;
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
					$home_dir=$this->create_dangling_directory();
					$prep=$this->pdo->prepare("insert into users(username,password,email,home_directory) values(:username,:password,:email,:dir)");
					$prep->bindParam(':username',$user);
					$prep->bindParam(':password',$hashed_pass);
					$prep->bindParam(':email',$email);
					$prep->bindParam(':dir',$home_dir);
					if($prep->execute()==false)
					{
						error_log("can't create user because there was an error in the sql statement");
						/*todo make an error page*/
						exit(1);
					}
				}
				return true;
			}
		}
	}

$database=new Database();
?>
