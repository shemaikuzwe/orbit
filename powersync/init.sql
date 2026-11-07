-- Runs once on an empty Postgres volume, in the linear_clone database.
-- Application tables belong to ORM/Better Auth migrations, never this file.
\getenv replication_password PS_REPLICATION_PASSWORD
\getenv storage_password PS_STORAGE_PASSWORD

CREATE ROLE powersync_replicator WITH REPLICATION BYPASSRLS LOGIN PASSWORD :'replication_password';
GRANT CONNECT ON DATABASE linear_clone TO powersync_replicator;
GRANT USAGE ON SCHEMA public TO powersync_replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_replicator;
-- Future migrations must run as postgres for these default grants to apply.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO powersync_replicator;
-- Development bootstrap: includes future tables before migrations exist.
-- Before production, narrow publication and grants to projects/issues/member/user.
CREATE PUBLICATION powersync FOR ALL TABLES;

-- Infrastructure-only database initialization: isolates bucket data from source
-- replication. PowerSync creates/manages its own storage schema automatically.
CREATE ROLE powersync_storage WITH LOGIN PASSWORD :'storage_password';
CREATE DATABASE powersync_storage OWNER powersync_storage;
REVOKE ALL ON DATABASE powersync_storage FROM PUBLIC;
