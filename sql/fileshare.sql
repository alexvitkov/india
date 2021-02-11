/*base user information*/
create table users (
  user_id int not null auto_increment,
  username varchar(50) not null unique,
  password varchar(255) not null,
  email varchar(50),
  primary key (user_id)
);

/*table has only one owner and is identifyed by a number*/
create table files (
  file_id int not null auto_increment,
  owner_id int default null,
  relative_path varchar(500) not null,
  type varchar(20) not null default 'data',
  primary key (file_id),
  foreign key (owner_id) references users(user_id)
);

/*the user with userid is given some kind of access to the file with fileid*/
/*there is no edit bit because it will be too dificult to implement prehaps a change bit is in order (but not an edit bit)*/
/*might be beneficial to even go full minimalist and remove the remove bit and only have the view bit*/
create table access (
  file_id int not null,
  user_id int not null,
   
  can_view boolean not null default true,
  can_remove boolean not null default false,
  check (can_view=true or can_remove=true) ,
  foreign key (file_id) references files(file_id),
  foreign key (user_id) references users(user_id)
);
