-- migrate:up
create table if not exists cards (
    card_id integer primary key,
    name text not null unique,
    selected boolean not null,
    puk text,
    pairing_code text,
    pairing_key text,
    pairing_index integer
);


-- migrate:down
drop table if exists cards;