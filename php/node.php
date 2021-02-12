<?php 
require_once "database.php";

	class Node
	{
		public $node_id;
		public $is_directory;
		public $relative_path;
		public $type;
		public $name;
		public $note;
		function __construct($node_id)
		{
			$this->node_id=$node_id;
		}
	}
	class Current_Directory
	{
		/*an array of the dir_ids taken to reach here*/
		public $path;

		function __construct($user_id)
		{
			$this->dir_id=get_home_id($user_id);
			$this->path=[$dir_id];
		}
		function change_directory($directory_id):bool
		{
			global $database;
			if(!$database->is_directory($directory_id))
			{
				return false;
			}
			
		}
	}

?>
