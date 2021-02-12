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

			$prep=$this->pdo->prepare("select user_id,username,email,home_directory from users where username=:username");
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

			$prep=$this->pdo->prepare("select user_id,username,email,password,home_directory from users where username=:username");
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
					$ret->home_directory=$hold["home_directory"];
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

		/*returns assoc array*/
		function get_nodes_with_name($name)
		{
			$statement=$this->pdo->prepare(
					"select node_id
					 from node_links
					 where name=:name"
					);
			$statement->bindParam(':name',$name);
			if($statement->execute()==NULL)
			{
				error_log("there was a problem with the sql statement at get_nodes_with_name");
				return [];
			}
			return $statement->fetchAll(PDO::FETCH_ASSOC);
		}

		/*returns assoc array*/
		function get_node_with_code($code)
		{
			$statement=$this->pdo->prepare(
					"select node_id as id
					 from nodes
					 where code=:code"
					);
			$statement->bindParam(':code',$code);
			if($statement->execute()==NULL)
			{
				error_log("there was a problem with the sql statement at get_nodes_with_code");
				return [];
			}
			return $statement->fetch(PDO::FETCH_ASSOC);
		}
		/* I think this only makes sense if node is a dir*/
		/* returns assoc array of nodes*/
		function get_links_of(int $node_id)
		{
			error_log("in get_links_of with argument {$node_id}");
			$statement=$this->pdo->prepare("
							select node_links.node_id as id,
								node_links.name as name,
								node_links.note as note,
								nodes.is_directory as is_directory,
								nodes.code as code,
								nodes.type as mimetype
								from node_links
								inner join nodes on
								nodes.node_id=node_links.node_id
								where node_links.directory_id=:id
							");
			$statement->bindParam(':id',$node_id);
			if($statement->execute()==false)
			{
				error_log("there is an error in the sql statement in get_links_of");
				return [];
			}
			return $statement->fetchAll(PDO::FETCH_ASSOC);
		}

		/*if both are not null returns the id of the node with the name name in the directory_id node*/
		function get_node_id($name,$directory_id)
		{
			$statement=$this->pdo->prepare(
				"select nl.node_id as id from node_links nl
				inner join nodes n on n.node_id=nl.node_id 
				where name=:name and directory_id=:directory_id)");
			$statement->bindParam(':name',$name);
			$statement->bindParam(':directory_id',$directory_id);
			if($statement->execute()==false)
			{
				error_log("there is an error in the sql statement in get_node_id");
				return NULL;
			}
			$hold=$statement->fetch(PDO::FETCH_ASSOC);
			if($hold==false)
			{
				return NULL;
			}else
			{
				return $hold["id"];
			}

		}





		/*is used to get a random codename for the node as well*/
		function get_random_node_name(string $prefix)
		{
			do{
				$proposal=uniqid($prefix,true);
			}while(count($this->get_nodes_with_name($proposal))!=0);
			return $proposal;
		}


		function get_premissions(int $node_id,int $user_id)
		{

			$prep=$this->pdo->prepare("
							select can_view,can_edit
							from node_access
							where node_id=:node and user_id=:user
							");
			$prep->bindParam(':node',$node_id);
			$prep->bindParam(':user',$user_id);
			if($prep->execute()==false)
			{
				error_log("there is an error with the sql statemtent at get_premissions");
				return NULL;
			}
			$ret=$prep->fetch(PDO::FETCH_ASSOC);
			if(gettype($ret)=="boolean")
			{
				$prep=$this->pdo->prepare("insert into 
							node_access(node_id,user_id,can_view,can_edit)
							values(:node,:user,false,false)");
				$prep->bindParam(':node',$node_id);
				$prep->bindParam(':user',$user_id);
				if($prep->execute()==false)
				{
					error_log("couldnt create access entry in get_premissions2");
					return NULL;
				}



				$prep=$this->pdo->prepare("
								select can_view,can_edit
								from node_access
								where node_id=:node and user_id=:user
								");
				$prep->bindParam(':node',$node_id);
				$prep->bindParam(':user',$user_id);
				if($prep->execute()==false)
				{
					error_log("there is an error with the sql statemtent at get_premissions3");
					return NULL;
				}
				$ret=$prep->fetch(PDO::FETCH_ASSOC);
			}
			return $ret;
		}

		function give_view_access(int $node_id,int $user_id)
		{
			$premissions=$this->get_premissions($node_id,$user_id);
			/*this isn't futile because we create access entries in get_premission if there are none*/
			if($premissions["can_view"]==false)
			{
				$prep=$this->pdo->prepare("update node_access 
								set can_view=true
								where node_id=:node and user_id=:user
								");
				$prep->bindParam(':node',$node_id);
				$prep->bindParam(':user',$user_id);
				if($prep->execute()==false)
				{
					error_log("could not execute sql statement in guve_view_access");
				}

			}
		}

		function give_edit_access(int $node_id,int $user_id)
		{
			$premissions=$this->get_premissions($node_id,$user_id);
			/*this isn't futile because we create access entries in get_premission if there are none*/
			if($premissions["can_edit"]==false)
			{
				$prep=$this->pdo->prepare("update node_access 
								set can_edit=true
								where node_id=:node and user_id=:user
								");
				$prep->bindParam(':node',$node_id);
				$prep->bindParam(':user',$user_id);
				if($prep->execute()==false)
				{
					error_log("could not execute sql statement in give_edit_access");
				}

			}
		}

		/*this is used to create seperate roots for the users*/
		function create_dangling_directory(): int
		{
			$code_name=$this->get_random_node_name("");
			global $storage_root;

			/*create directory node*/
			$prep=$this->pdo->prepare("insert into nodes(is_directory,relative_path,code) values(true,:root,:code)");
			$prep->bindParam(':code',$code_name);
			$prep->bindParam(':root',$code_name);
			if($prep->execute()==false)
			{
				error_log("tried to create a dangling directory but sql statement failed. Fatal error!");
				exit(1);
			}
			/*give premissions*/

			$id=$this->get_node_with_code($code_name);
			if(count($id)!=1)
			{
				error_log("created a dangling directory but couldn't find it afterward. Fatal error!");
				exit(1);
			}

			//print count($id);
			return $id["id"];
		}

		/*links source to target*/
		function link_nodes(int $target_id,int $source_id,string $name,string $note)
		{
			$statement=$this->pdo->prepare("
							insert into node_links(directory_id,node_id,name,note)
							values (:dir,:node,:name,:note)
							");
			$statement->bindParam(':dir',$target_id);
			$statement->bindParam(':node',$source_id);
			$statement->bindParam(':name',$name);
			$statement->bindParam(':note',$note);
			if($statement->execute()==false)
			{
				error_log("there was an error with the statement ni link_nodes");
			}
		}
		/*returns the file name as it must be in the filesystem relative to the storage root*/
		function create_file_node(string $filename,string $note,int $dir_id,string $mimetype,User $user): string
		{
			global $storage_root;
			/*checkout the directory*/
			$dir_prep=$this->pdo->prepare("
							select 
							nodes.is_directory as is_directory,
							node_access.can_edit as can_edit
							from nodes
							inner join node_access on 
							nodes.node_id=node_access.node_id
							where nodes.node_id=:dir_id
							");
			$dir_prep->bindParam(':dir_id',$dir_id);
			if($dir_prep->execute()==false)
			{
				error_log("could not exedude dir sql statement in create_file_node");
				return "error";
			}
			if(($dir=$dir_prep->fetch(PDO::FETCH_ASSOC))==false)
			{
				error_log("create_file_node dir isnt a directory");
				return "error";
			}
			if($dir["is_directory"]==false)
			{
				/*remove this TODO*/
				error_log("create_file_node: dir is not a directory directory=".print_r($dir).gettype($dir));
				return "error";
			}
			if($dir["can_edit"]==false)
			{
				/*TODO*/
				/*remove this TODO*/
				error_log("create_file_node: dir is not modifiable");
				return "error";
			}

			/*generate the node*/
			$code=$this->get_random_node_name("");
			if($filename==NULL)return "error";
			$prep=$this->pdo->prepare("insert into nodes(is_directory,relative_path,code,type)
						   values(false,:root,:code,:type)
						   ");
			$prep->bindParam(':root',$code);
			$prep->bindParam(':code',$code);
			$prep->bindParam(':type',$mimetype);

			if($prep->execute()==false)
			{
				error_log("could not upload file");
				/*not so quiet error*/
				return "error";
			}
			$new_id=$this->get_node_with_code($code)["id"];
			/*link the node to the directory*/
			$this->link_nodes($dir_id,$new_id,$filename,$note);
			/*give premissions to the creator*/

			$this->give_view_access($new_id,$user->user_id);
			$this->give_edit_access($new_id,$user->user_id);
			return $code;
		}
		/*checks if there is a link between two node_id-s*/
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
					$user_id=$this->get_user($user)->user_id;
					$this->give_view_access($home_dir,$user_id);
					$this->give_edit_access($home_dir,$user_id);
				}
				return true;
			}
		}
	}

$database=new Database();
?>
