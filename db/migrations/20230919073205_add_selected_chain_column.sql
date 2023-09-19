-- migrate:up
alter table accounts add selected_chain boolean;
alter table accounts add selected_account boolean;

-- migrate:down
