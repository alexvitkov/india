create table nodes (
	node_id int not null auto_increment,
	is_directory boolean default false,
	relative_path varchar(500) not null,
	type varchar(20) not null default 'data',
	name varchar(100) not null default 'no name',
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

create table node_links (
	directory_id int not null,
	node_id int not null,
	check (directory_id != node_id), 
	foreign key (directory_id) references nodes(node_id),
	foreign key (node_id) references nodes(node_id)
);


