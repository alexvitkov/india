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
	class Directory_Node extends Node
	{
		public $node_list;
		/*the path in terms of the simulated filesystem*/
		function __construct(string $abstract_path)
		{
		}
	}

?>
