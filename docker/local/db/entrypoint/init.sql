CREATE ROLE api WITH login;
CREATE SCHEMA AUTHORIZATION api; -- Creates 'api' schema owned by 'api' role

CREATE ROLE cms WITH login;
CREATE SCHEMA AUTHORIZATION cms;
