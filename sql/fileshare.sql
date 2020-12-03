drop database fileshare;





create database fileshare;
use fileshare;

/*base user information*/
create table users (
  id int not null auto_increment,
  username varchar(50) not null unique,
  password varchar(100) not null unique,
  primary key (id)
);

/*table has only one owner and is identifyed by a number*/
create table files (
  id int not null auto_increment,
  owner int default null,
  absolutepath varchar(500) not null,
  type varchar(20) not null default 'data',
  primary key (id),
  foreign key (owner) references users(id)
);

/*the user with userid is given some kind of access to the file with fileid*/
/*there is no edit bit because it will be too dificult to implement prehaps a change bit is in order (but not an edit bit)*/
/*might be beneficial to even go full minimalist and remove the remove bit and only have the view bit*/
create table access (
  fileid int not null,
  userid int not null,
  canview boolean not null default true,
  canremove boolean not null default false,
  check (canview=true or canremove=true) ,
  foreign key (fileid) references files(id),
  foreign key (userid) references users(id)
);



/*basic info for testing purposes*/
insert into users(username,password) values ("root","asdf");
insert into users(username,password) values ("tester","tester");
insert into files(owner,absolutepath,type) values (1,"/root/jiberish.sh","shell script");
insert into access(fileid,userid,canview,canremove) values(1,2,true,false);
/*I am not sure why this passes ....*/
insert into access(fileid,userid,canview,canremove) values(1,2,false,false);
