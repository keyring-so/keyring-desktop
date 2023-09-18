CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE cards (
    card_id integer primary key,
    name text not null unique,
    selected boolean not null,
    puk text,
    pairing_code text,
    pairing_key text,
    pairing_index integer
);
CREATE TABLE accounts (
    account_id integer primary key,
    card_id integer not null,
    chain_name text not null,
    addr text not null
);
CREATE TABLE assets (
    asset_id integer primary key,
    account_id integer not null,
    token_contract text not null
);
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20230908080559'),
  ('20230908101337'),
  ('20230908101344');
