import { Injectable } from '@nestjs/common';
import { Client } from 'pg';
import { PG_CLIENT_CONFIG } from '../../constants';
import { User } from '../models';

@Injectable()
export class UsersService {
  constructor() {
  }

  async findOne(userId: string): Promise<User> {
    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      const queryResult = await client.query({
        text: `SELECT * FROM users WHERE id = $1`,
        values: [userId]
      });

      const user = queryResult.rows?.[0];

      return user && {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password
      };
    }
    finally {
      await client.end();
    }
  }

  async createOne({ name, password }: User): Promise<User> {
    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      const queryResult = await client.query({
        text: `INSERT INTO users (name, password) VALUES ($1, $2) RETURNING id`,
        values: [name, password]
      });

      return {
        id: queryResult.rows[0].id,
        name: name,
        password: password
      };
    }
    finally {
      await client.end();
    }
  }
}
