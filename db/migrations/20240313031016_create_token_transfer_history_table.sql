-- migrate:up
create table if not exists token_transfer_history (
    token_tx_id integer primary key,
    account_id integer not null,
    chain_name text not null,
    hash text not null,
    timestamp text not null,
    from text not null,
    to text not null,
    value text not null,
    contract text not null default "",
    symbol text not null default "",
    type text not null default ""
);

-- migrate:down
drop table if exists token_transfer_history;
