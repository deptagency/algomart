# Migrations for API database

This project contains the migrations for the API database and a basic CLI to apply them given a database connection string. You can execute it with one of the following commands (each mapped to the corresponding Knex migration command):

```bash
nx run migrations:up
nx run migrations:down
nx run migrations:latest
nx run migrations:rollback
nx run migrations:status
nx run migrations:list
nx run migrations:currentVersion
nx run migrations:make --args="--name=NewMigrationName"
```
