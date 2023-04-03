import { ClientConfig } from "pg";

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;

export const JWT_CONFIG = {
  secret: 'secret',
  expiresIn: '12h'
}

export const PG_CLIENT_CONFIG: ClientConfig = {
  host: PG_HOST,
  port: parseInt(PG_PORT),
  database: PG_DATABASE,
  user: PG_USERNAME,
  password: PG_PASSWORD,
  connectionTimeoutMillis: 3000,
  ssl: {
    rejectUnauthorized: false
  }
};
