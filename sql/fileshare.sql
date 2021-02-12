/*BEWARE!*/
drop table if exists users;
drop table if exists nodes;
drop table if exists node_access;
drop table if exists node_links;




create table nodes (
	node_id int not null auto_increment,
	is_directory boolean default false,
	relative_path varchar(500) not null,
	type varchar(20) not null default 'data',
	note varchar(200) not null default "",
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
	foreign key (home_directory) references nodes(node_id)
);

create table node_access (
	node_id int not null,
	user_id int not null,

	can_view boolean not null default true,
	can_edit boolean not null default false,
	check (can_view=true or can_edit=true) ,
	foreign key (node_id) references nodes(node_id),
	foreign key (user_id) references users(user_id)
);
/*we can name a node in many different ways */
create table node_links (
	directory_id int not null,
	node_id int not null,
	name varchar(100) not null default 'no name',
	check (directory_id != node_id), 
	foreign key (directory_id) references nodes(node_id),
	foreign key (node_id) references nodes(node_id)
);


