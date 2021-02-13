<?php 
require_once "database.php";
require_once "user.php";
	
	class Node
	{
		public $node_id;
		public $is_directory;
		public $relative_path;
		public $type;
		public $code;
	}
	class Shared_Node
	{
		public $node_id;
		public $code;
		public $password;
	}
	/*path is in terms of the simulated filesystem*/
	/*returns NULL on error*/
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
	function create_share_link(string $abstract_path,string $filename,string $password,User $user,bool $can_read,bool $can_write)
	{
		global $database;
		global $domain_name;
		global $use_https;

		$dir_id=get_directory($abstract_path,$user);
		if($dir_id==NULL)
		{
			return NULL;
		}
		$node_id=$database->get_node_id($filename,$dir_id);
		if($node_id==NULL)
		{
			return NULL;
		}
		$shared_node=$database->create_shared_node($password,$node_id);
		if($shared_node==NULL)
		{
			return NULL;
		}
		
		if($can_read)
			$database->give_view_access($node_id,$user->user_id);
		if($can_write)
			$database->give_edit_access($node_id,$user->user_id);
		if($use_https)
		{
			return "https://".$domain_name."/php/share.php?file=".$shared_node->code;
		}else
		{
			return "http://".$domain_name."/php/share.php?file=".$shared_node->code;
		}
	}

?>
