<?php 
require_once "database.php";
require_once "user.php";

	
	/*returns an assoc arrat of Node-s*/
	/*path is in terms of the simulated filesystem*/
	function get_directory(string $abstract_path,User $user)
	{
		if($abstract_path[0]!="/")
		{
			return NULL;
		}
		if($component=strtok($abstract_path,"/")==false)
		{
			return NULL;
		}
		$current_dir=$database->get_node($component,$user->home_directory);
		if($current_dir==NULL)
			return NULL;
		/*traverse path*/
		while($component=strtok("/"))
		{
			$current_dir=get_node($component,$current_dir);
			if($current_dir==NULL)
				return NULL;
		}
		return get_links_of(NULL,$current_dir);
	}

?>
