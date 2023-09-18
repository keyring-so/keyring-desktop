-- migrate:up
create table if not exists accounts (
    account_id integer primary key,
    card_id integer not null,
    chain_name text not null,
    addr text not null
);


-- migrate:down
drop table if exists accounts;
