CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE cards (
    card_id integer primary key,
    name text not null unique,
    selected boolean not null,
    puk text not null,
    pairing_code text not null,
    pairing_key text not null,
    pairing_index text not null
);
CREATE TABLE accounts (
    account_id integer primary key,
    card_id integer not null,
    chain_name text not null,
    address text not null,
    selected_account boolean
);
CREATE TABLE assets (
    asset_id integer primary key,
    account_id integer not null,
    token_symbol text not null
);
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20230908080559'),
  ('20230908101337'),
  ('20230908101344');
