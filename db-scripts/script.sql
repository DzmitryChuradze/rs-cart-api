create type cart_status as enum ('OPEN', 'ORDERED');

create table users (
  id uuid primary key default uuid_generate_v4(),
  name varchar(50) not null,
  email varchar(50),
  password varchar(50) not null,
  unique (name)
)

create table carts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp,
    status cart_status default 'OPEN',
    foreign key (user_id) references users (id) on delete cascade
)

create table cart_items (
    cart_id uuid not null,
    product_id uuid not null,
    count integer not null,
    foreign key (cart_id) references carts (id) on delete cascade
)

create table orders (
    id uuid primary key default uuid_generate_v4(),
    cart_id uuid not null,
    payment json,
    delivery json,
    comments text,
    status text,
    total integer,
    foreign key (cart_id) references carts (id) on delete cascade
)

insert into users (name, email, password) values
('Bob', 'bob@gmail.com', 'qwe'),
('Peter', 'peter@gmail.com', 'qwe'),
('Jim', 'jim@gmail.com', 'qwe')
