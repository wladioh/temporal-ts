# helm install -f values/values.mysql.yaml temporallocal .
cd temporal
export SQL_PLUGIN=mysql
export SQL_HOST=localhost
export SQL_PORT=3306
export SQL_USER=root
export SQL_PASSWORD=password

./temporal-sql-tool -db temporal --ep $SQL_HOST -p $SQL_PORT --plugin mysql create
./temporal-sql-tool --ep $SQL_HOST -p $SQL_PORT --db temporal_visibility --plugin mysql create

./temporal-sql-tool --ep $SQL_HOST -p $SQL_PORT --plugin mysql --db temporal setup-schema -v 0.1 -- this sets up just the schema version tables with initial version of 0.0
./temporal-sql-tool --ep $SQL_HOST -p $SQL_PORT --plugin mysql --db temporal update-schema -d ./schema/mysql/v57/temporal/versioned -- upgrades your schema to the latest version

./temporal-sql-tool --ep $SQL_HOST -p $SQL_PORT --plugin mysql --db temporal_visibility setup-schema -v 0.1 -- this sets up just the schema version tables with initial version of 0.0 for visibility
./temporal-sql-tool --ep $SQL_HOST -p $SQL_PORT --plugin mysql --db temporal_visibility update-schema -d ./schema/mysql/v57/visibility/versioned  -- upgrades your schema to the latest version for visibility
cd ../helm-charts

# helm dependencies update
# helm upgrade -f values/values.mysql.yaml temporaltest . --timeout 900s

# tctl --namespace default namespace register

