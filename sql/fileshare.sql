/*BEWARE!*/
drop table if exists node_access;
drop table if exists users;
drop table if exists node_links;
drop table if exists trash;
drop table if exists super_trash;
drop table if exists shared_nodes;
drop table if exists nodes;



drop trigger if exists delete_on_zero_links;
drop trigger if exists delete_links;
drop trigger if exists del_node;
drop trigger if exists supper_del_node;





create table nodes (
	node_id int not null auto_increment,
	is_directory boolean default false,
	relative_path varchar(500) not null,
	type varchar(20) not null default 'data',
	code varchar(100) not null default "error",
	primary key (node_id)
);

/*base user information*/
create table users (
	user_id int not null auto_increment,
	username varchar(50) not null unique,
	password varchar(255) not null,
	email varchar(50),
	home_directory int not null,
	primary key (user_id),
	foreign key (home_directory) references nodes(node_id) on delete cascade
);

create table node_access (
	node_id int not null,
	user_id int not null,

	can_view boolean not null default true,
	can_edit boolean not null default false,
	foreign key (node_id) references nodes(node_id) on delete cascade,
	foreign key (user_id) references users(user_id) on delete cascade
);
/*we can name a node in many different ways */
create table node_links (
	directory_id int not null,
	node_id int not null,
	name varchar(100) not null default 'no name',
	note varchar(200) not null default "",
	foreign key (directory_id) references nodes(node_id) on delete cascade,
	foreign key (node_id) references nodes(node_id) on delete cascade
);

/*we store passwords for the shared links here, it doesn't really have anything to do with the filesystem*/
create table shared_nodes (
	node_id int not null,
	passcode varchar(100) default "",
	foreign key (node_id) references nodes(node_id) on delete cascade
);

create table trash (
	node_id int not null
);
create table super_trash (
	node_id int not null
);


create trigger delete_on_zero_links
	after delete
	on node_links
	for each row 
		insert into trash
		select nodes.node_id
		from nodes
		where nodes.node_id not in (select node_id from node_links) and 
					(nodes.node_id=old.node_id );
			
create trigger del_node
	after delete
	on trash
	for each row
		insert into super_trash(node_id) 
			select node_id
			from nodes
			where nodes.node_id=old.node_id;
	

create trigger supper_del_node
	after delete
	on super_trash
	for each row
		insert into trash 
		select node_id
		from nodes
		where nodes.node_id=old.node_id;

create trigger delete_links
	before delete
	on super_trash
	for each row
		delete from node_links
		where directory_id=old.node_id;
