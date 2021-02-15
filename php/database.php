<?php 
require_once "configuration.php";
require_once "user.php";
require_once "misc.php";
require_once "node.php";

/*handles database stuff*/
	class Database
	{
		public $pdo;


		public function __construct()
		{
			global $domain_name;
			global $database_name;
			global $database_username;
			global $database_password;
			global $database_location;

				$this->pdo=new PDO("mysql:dbname={$database_name};host={$database_location}",$database_username,$database_password);
		}

		/*returns NULL if this isn't a user, otherwise returns the user in the form of the User class*/
		function get_user(string $user) 
		{
			$ret=new User;

			$prep=$this->pdo->prepare("select user_id,username,email,home_directory from users where username=:username");
			$prep->bindParam(':username',$user);

			$prep->execute();

			$hold=$prep->fetch(PDO::FETCH_ASSOC);

			if(isset($hold["user_id"]))
			{
				$ret->user_id=$hold["user_id"];
				$ret->username=$hold["username"];
				$ret->email_address=$hold["email"];
				$ret->home_directory=$hold["home_directory"];
				return $ret;
			}else
			{
				return NULL;
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

		/*returns assoc array , or NULL on error*/
		function get_nodes_with_name($name)
		{
			$statement=$this->pdo->prepare(
					"select node_id
					 from node_links
					 where name=:name"
					);
			$statement->bindParam(':name',$name);
			if($statement->execute()==false)
			{
				error_log("there was a problem with the sql statement at get_nodes_with_name");
				return NULL;
			}
			return $statement->fetchAll(PDO::FETCH_ASSOC);
		}

		/*returns id or NULL on error*/
		function get_node_with_code($code)
		{
			$statement=$this->pdo->prepare(
					"select node_id as id
					 from nodes
					 where code=:code"
					);
			$statement->bindParam(':code',$code);
			if($statement->execute()==false)
			{
				error_log("there was a problem with the sql statement at get_nodes_with_code");
				return NULL;
			}
			$ret= $statement->fetch(PDO::FETCH_ASSOC);
			if(isset($ret["id"]))
			{
				return $ret["id"];
			}else
			{
				return NULL;
			}
		}
		/* I think this only makes sense if node is a dir*/
		/* returns assoc array of nodes*/
		/* returns permissions as well*/
		function get_links_of(int $node_id,int $user_id)
		{
			$statement=$this->pdo->prepare("
							select node_links.node_id as id,
								node_links.name as name,
								node_links.note as note,
								nodes.is_directory as is_directory,
								nodes.code as code,
								nodes.type as mimetype,
								node_access.can_view as can_view,
								node_access.can_view as can_eddit
								from node_links
								inner join nodes on
									nodes.node_id=node_links.node_id
								inner join node_access on 
									node_access.node_id=node_links.node_id
								where 
								node_links.directory_id=:id and
								node_access.user_id=:user_id
							");
			$statement->bindParam(':id',$node_id);
			$statement->bindParam(':user_id',$user_id);
			if($statement->execute()==false)
			{
				error_log("there is an error in the sql statement in get_links_of");
				return [];
			}
			return $statement->fetchAll(PDO::FETCH_ASSOC);
		}

		/*if both are not null returns the id of the node with the name name in the directory_id node*/
		function get_node_id(string $name,int $directory_id)
		{
			$statement=$this->pdo->prepare("
					select node_links.node_id as id
					from node_links 
					inner join nodes on
					nodes.node_id=node_links.node_id 
					where node_links.name=:name and node_links.directory_id=:directory_id
				");
			$statement->bindParam(':name',$name);
			$statement->bindParam(':directory_id',$directory_id);
			if($statement->execute()==false)
			{
				error_log("there is an error in the sql statement in get_node_id");
				return NULL;
			}
			$hold=$statement->fetch(PDO::FETCH_ASSOC);
			if(gettype($hold)!="array")
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


		function get_permissions(int $node_id,int $user_id)
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
				error_log("there is an error with the sql statemtent at get_permissions");
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
					error_log("couldnt create access entry in get_permissions2");
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
					error_log("there is an error with the sql statemtent at get_permissions3");
					return NULL;
				}
				$ret=$prep->fetch(PDO::FETCH_ASSOC);
			}
			return $ret;
		}

		function give_view_access(int $node_id,int $user_id)
		{
			$permissions=$this->get_permissions($node_id,$user_id);
			/*this isn't futile because we create access entries in get_permission if there are none*/
			if($permissions["can_view"]==false)
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
			$permissions=$this->get_permissions($node_id,$user_id);
			/*this isn't futile because we create access entries in get_permission if there are none*/
			if($permissions["can_edit"]==false)
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
		/*returns NULL if directory or error*/
		function get_code_of_node(int $node_id)
		{
			global $storage_root;

			$prep=$this->pdo->prepare("select code
						   from nodes
						   where node_id=:id
						  ");
			$prep->bindParam(':id',$node_id);
			if($prep->execute()==false)
			{
				error_log("could not execute sql statement in get_file_location_of_node");
				return NULL;
			}
			$hold=$prep->fetch(PDO::FETCH_ASSOC);
			if(count($hold)!=1)
			{
				return NULL;
			}else
			{
				/*BEWARE*/
				return $hold["code"];
			}
		}
		/*
		   we remove the node and
		   1. move the file represented by the node to the trash folder
		   2. remove the file
		   depends on the conf file
		 */
		function delete_node_by_id(int $node_id)
		{
			global $has_trash;
			global $storage_root;

			$location=get_file_location_of_node($node_id);

			/*actually delete the file*/
			if($has_trash)
			{
				/*BEWARE*/
				if(!copy($storage_root."/".$location,$storage_root."/trash/".$location))
				{
					error_log("could not copy file aborting node deletion in delete_node_by_id");
					return;
				}
			}
			unlink($storage_root."/".$location);

			if($location==NULL)
			{
				error_log("trying to delete a node that does not exist in delete_node_by_id!");
				return;
			}
			$prep=$this->pdo->prepare("delete
						   from nodes
						   where node_id=:id
						   ");
			$prep->bindParam(':id',$node_id);
			if($prep->execute()==false)
			{
				error_log("sql statement in delete_node_by_id could not execute");
				return NULL;
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
			/*give permissions*/

			$id=$this->get_node_with_code($code_name);
			if($id==NULL)
			{
				error_log("created a dangling directory but couldn't find it afterward. Fatal error!");
				exit(1);
			}

			//print count($id);
			return $id;
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


		function unlink_nodes(int $dir_id, string $filename)
		{
			global $storage_root;
			/*TODO delet this*/
			error_log("in unlink nodes");
			$prep=$this->pdo->prepare("delete from node_links
						   where directory_id=:dir_id and name=:name
						");
			$prep->bindParam(':dir_id',$dir_id);
			$prep->bindParam(':name',$filename);
			if($prep->execute()==false)
			{
				error_log("there was an error with the first statement in unlink_nodes");
				return;
			}
			error_log("in pre stuff in unlink nodes");
			$prep=$this->pdo->prepare("select count(1) as count from trash");
			$prep->execute() or die(1);
			do{


				$prep=$this->pdo->prepare("select count(1) as count from super_trash");
				$prep->execute() or die(1);
				$super_trash_count=$prep->fetch(PDO::FETCH_ASSOC);
				$prep=$this->pdo->prepare("delete from super_trash");
				$prep->execute() or die(1);



				$prep=$this->pdo->prepare("select count(1) as count from trash");
				$prep->execute() or die(1);
				$trash_count=$prep->fetch(PDO::FETCH_ASSOC);
				$prep=$this->pdo->prepare("delete from trash");
				$prep->execute() or die(1);

				error_log("asdf: ".$trash_count["count"]." ".$super_trash_count["count"]);
			}while($trash_count["count"]!=$super_trash_count["count"]);

			$prep=$this->pdo->prepare("select code from nodes where node_id in
							(select node_id from super_trash)");
			$prep->execute() or die(1);
			$res=$prep->fetchAll(PDO::FETCH_ASSOC);
			foreach($res as $node)
			{
				unlink($storage_root."/".$node["code"]);
				error_log("deleting: ".$storage_root."/".$node["code"]);
			}
			$prep=$this->pdo->prepare("delete from nodes where node_id in
								(select node_id from super_trash)");
			$prep->execute() or die(1);
			$prep=$this->pdo->prepare("delete from super_trash");
			$prep->execute() or die(1);


		}

		function create_home_directory()
		{
			$home_id=$this->create_dangling_directory();
			$trash_folder_id=$this->create_dangling_directory();
			$this->link_nodes($home_id,$trash_folder_id,"trash","trash folder");

			$share_folder_id=$this->create_dangling_directory();
			$this->link_nodes($home_id,$share_folder_id,"share","shared things go in here");

			$ret=array("home" => $home_id, "trash" => $trash_folder_id , "share" =>$share_folder_id);
			return $ret;
		}

		function check_if_name_is_taken(string $filename,int $dir_id):bool
		{
			if($this->get_node_id($filename,$dir_id)!=NULL)
			{
				return true;
			}else
			{
				return false;
			}

		}
		function create_shared_node(string $password,int $node_id,string $users)
		{
			$code=$this->get_random_node_name("");
			$prep=$this->pdo->prepare("insert into shared_nodes(node_id,passcode,code,is_public)
							values (:id,:pass,:code,:is_public)
						");
			$prep->bindParam(':id',$node_id);
			$prep->bindParam(':pass',$password);
			$prep->bindParam(':code',$code);
			if($users=="")
			{
				$is_public=1;
			}else
			{
				$is_public=0;
				error_log("shared with $users is set to public=$is_public");
			}
			$prep->bindParam(':is_public',$is_public);

			if($prep->execute()==false)
			{
				error_log("could not create shared node in create_shared_node");
				return NULL;
			}
			$shared_node=new Shared_Node();
			$shared_node->code=$code;
			$shared_node->node_id=$node_id;
			$shared_node->password=$password;
			return $shared_node;
		}
		function get_node(int $node_id)
		{
			$prep=$this->pdo->prepare("select * from nodes where node_id=:id");
			$prep->bindParam(':id',$node_id);
			if($prep->execute()==false)
			{
				error_log("sql statement at get_node failed");
				return NULL;
			}
			$nod=$prep->fetch(PDO::FETCH_ASSOC);
			$ret=new Node();

			$ret->node_id=$nod["node_id"];
			$ret->is_directory=$nod["is_directory"];
			$ret->relative_path=$nod["relative_path"];
			$ret->type=$nod["type"];
			$ret->code=$nod["code"];

			return $ret;

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

			$dir=$dir_prep->fetch(PDO::FETCH_ASSOC);
			if($dir == false)
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

			/*check if node with given name exists*/
			if($this->check_if_name_is_taken($filename,$dir_id))
			{
				error_log("filename taken");
				return "filename taken";
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
			$new_id=$this->get_node_with_code($code);
			/*link the node to the directory*/
			$this->link_nodes($dir_id,$new_id,$filename,$note);
			/*give permissions to the creator*/

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
		function get_shared_node(string $code)
		{
			$prepare=$this->pdo->prepare("
							select * from shared_nodes where code=:code	
					");
			$prepare->bindParam(':code',$code);
			if($prepare->execute()==false)
			{
				error_log("sql statement at get_shared_node failed");
				return NULL;
			}
			$ret=$prepare->fetch(PDO::FETCH_ASSOC);
			$nod=new Shared_Node();
			$nod->node_id=$ret["node_id"];
			$nod->password=$ret["passcode"];
			$nod->code=$ret["code"];
			$nod->is_public=$ret["is_public"];
			return $nod;
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
					$dirs=$this->create_home_directory();
					$prep=$this->pdo->prepare("insert into users(username,password,email,home_directory) values(:username,:password,:email,:dir)");
					$prep->bindParam(':username',$user);
					$prep->bindParam(':password',$hashed_pass);
					$prep->bindParam(':email',$email);
					$prep->bindParam(':dir',$dirs["home"]);
					if($prep->execute()==false)
					{
						error_log("can't create user because there was an error in the sql statement");
						/*todo make an error page*/
						exit(1);
					}
					$user_id=$this->get_user($user)->user_id;
					$this->give_view_access($dirs["home"],$user_id);
					$this->give_edit_access($dirs["home"],$user_id);

					$this->give_view_access($dirs["trash"],$user_id);
					$this->give_edit_access($dirs["trash"],$user_id);

					$this->give_view_access($dirs["share"],$user_id);
					$this->give_edit_access($dirs["share"],$user_id);
				}
				return true;
			}
		}
	}

$database=new Database();
?>
