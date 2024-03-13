-- migrate:up
create table if not exists transaction_history (
    history_id integer primary key,
    account_id integer not null,
    chain_name text not null,
    hash text not null,
    timestamp text not null,
    status text not null,
    from text not null,
    to text not null,
    value text not null,
    fee text not null
);

-- migrate:down
drop table if exists transaction_history;
