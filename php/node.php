<?php 
require_once "database.php";
require_once "user.php";

	
	/*path is in terms of the simulated filesystem*/
	function get_directory(string $abstract_path,User $user)
	{
		global $database;
		if($abstract_path[0]!="/")
		{
			return NULL;
		}
		if($component=strtok($abstract_path,"/")==false)
		{
			return $user->home_directory;
		}
		$current_dir=$database->get_node_id($component,$user->home_directory);
		if($current_dir==NULL)
			return NULL;
		/*traverse path*/
		while($component=strtok("/"))
		{
			$current_dir=$database->get_node_id($component,$current_dir);
			if($current_dir==NULL)
				return NULL;
		}
		return $current_dir;
	}

	/*returns an assoc arrat of Node-s*/
	/*path is in terms of the simulated filesystem*/
	function get_directory_contents(string $abstract_path,User $user)
	{
		global $database;
		$dir_id=get_directory($abstract_path,$user);
		if($dir_id==NULL)
			return NULL;
		return $database->get_links_of($dir_id);
	}

	/*path is in terms of the simulated filesystem*/
	function create_directory(string $abstract_path,string $directory_name,string $note,User $user)
	{
		global $database;
		$dir_id=$database->create_dangling_directory();
		$parent_dir_id=get_directory($abstract_path,$user);
		$database->link_nodes($parent_dir_id,$dir_id,$directory_name,$note);
	}

?>
