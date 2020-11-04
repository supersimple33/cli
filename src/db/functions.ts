import { Client, query } from 'faunadb';
import { DatabaseListType, EnvironmentDatabasesType } from '.';
import { Database } from './classes';
import { ServiceDatabaseType } from './types';
const {
    Databases,
    Paginate,
    Select,
    Get,
    Map,
    Lambda,
    Var,
    CreateDatabase,
    MoveDatabase,
    Database: DB,
} = query;

export const getEnvironments = async (
    client: Client,
): Promise<DatabaseListType<object>> => {
    return await client.query(
        Map(Paginate(Databases()), Lambda('X', Get(Var('X')))),
    );
};

export const getDatabases = async (client: Client): Promise<Database[]> => {
    const result = <EnvironmentDatabasesType>(
        await client
            .query(
                Map(
                    Paginate(Databases()),
                    Lambda(
                        'env',
                        Map(
                            Paginate(Databases(Select('ref', Get(Var('env'))))),
                            Lambda('db', Get(Var('db'))),
                        ),
                    ),
                ),
            )
            .catch((err) => {
                console.error(err);
            })
    );
    let databases: Record<string, Database> = {};
    // TODO: make this better
    let obj: EnvironmentDatabasesType = JSON.parse(JSON.stringify(result));
    for (const env of obj.data) {
        for (const dbObject of env.data) {
            const dbId = dbObject.global_id;
            const dbName = dbObject.name;
            const dbEnv = dbObject.ref['@ref'].database['@ref'].id;
            if (Object.keys(databases).indexOf(dbName) == -1) {
                databases[dbName] = new Database(dbId, dbName);
            }
            databases[dbName].environments.add(dbEnv);
        }
    }
    return Object.values(databases);
};

export const getDatabase = async (
    client: Client,
    name: string,
    environment: string = 'dev',
): Promise<Database | null> => {
    const result = <ServiceDatabaseType>(
        await client.query(Get(DB(name, DB(environment)))).catch((err) => {
            if (err.message == 'invalid ref') {
                return null;
            }
            throw Error(err);
        })
    );
    if (result == null) return null;
    return new Database(result.global_id, result.name);
};

export const createDatabase = async (
    client: Client,
    name: string,
    environment: string = 'dev',
): Promise<Database | null> => {
    const existingDB = await getDatabase(client, name, environment);
    if (existingDB != null) {
        throw Error('DATABASE_EXISTS');
    }
    const result = <ServiceDatabaseType>await client
        .query(CreateDatabase({ name }))
        .then((db: any) => client.query(MoveDatabase(db.ref, DB(environment))))
        .catch((err) => {
            console.error(err);
        });
    return new Database(result.global_id, result.name);
};
