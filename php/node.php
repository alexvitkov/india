<?php 
require_once "database.php";
require_once "user.php";

	
	/*returns an assoc arrat of Node-s*/
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
			return $database->get_links_of($user->home_directory);
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
		return $database->get_links_of($current_dir);
	}

?>
