-- migrate:up
create table if not exists transaction_history (
    history_id integer primary key,
    account_id integer not null,
    chain_name text not null,
    hash text not null,
    timestamp integer not null,
    from text not null,
    to text not null,
    value text not null,
    contract text not null default ""
    token_symbol text not null default "",
    token_decimal integer
);

-- migrate:down
drop table if exists transaction_history;
