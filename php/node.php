<?php 
require_once "database.php";
require_once "user.php";
	
	/*path is in terms of the simulated filesystem*/
	function get_directory(string $abstract_path,User $user)
	{

		global $database;
		if($abstract_path[0] != "/")
		{
			return NULL;
		}

		$component = strtok($abstract_path,"/");
		$current_dir = $user->home_directory;

		while($component) 
		{
			$current_dir = $database->get_node_id($component, $current_dir);
			$component = strtok("/");
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

		$parent_dir_id=get_directory($abstract_path,$user);

		if($database->check_if_name_is_taken($directory_name,$parent_dir_id))
		{
			return NULL;
		}else
		{
			$dir_id=$database->create_dangling_directory();
			$database->link_nodes($parent_dir_id,$dir_id,$directory_name,$note);

			$database->give_view_access($dir_id, $user->user_id);
			$database->give_edit_access($dir_id, $user->user_id);
			return $dir_id;
		}
	}
	function unlink_from_folder(string $abstract_path,string $filename,User $user)
	{
		global $database;
		$parent_dir_id=get_directory($abstract_path,$user);
		$database->unlink_nodes($parent_dir_id,$filename);
	}

?>
