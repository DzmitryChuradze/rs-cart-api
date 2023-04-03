import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Injectable } from '@nestjs/common';
import { Client } from 'pg';
import { PG_CLIENT_CONFIG } from '../../constants';
import { Cart, Product } from '../models';

@Injectable()
export class CartService {
  async findByUserId(userId: string): Promise<Cart> {
    const pgClient = new Client(PG_CLIENT_CONFIG);
    const dynamoDbClient = new DynamoDBClient({ region: "eu-west-1" });

    await pgClient.connect();

    try {
      const command = new ScanCommand({ TableName: "products" });

      const pgQuery = pgClient.query({
        text: `SELECT * FROM carts c JOIN cart_items ci ON c.id = ci.cart_id WHERE c.user_id = $1`,
        values: [userId]
      });

      const [pgQueryResult, productsResult] = await Promise.all([pgQuery, dynamoDbClient.send(command)]);

      const products: Array<Product> = productsResult.Items.map(p => {
        const product = unmarshall(p);

        return {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price
        };
      });

      const cart = pgQueryResult.rows[0];

      return cart && {
        id: cart.id,
        items: pgQueryResult.rows.map(row => ({
          count: row.count,
          product: products.find(p => p.id == row.product_id)
        }))
      };
    }
    finally {
      dynamoDbClient.destroy();
      await pgClient.end();
    }
  }

  async createByUserId(userId: string): Promise<Cart> {
    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      const queryResult = await client.query({
        text: `INSERT INTO carts (user_id) VALUES ($1) RETURNING id`,
        values: [userId]
      });

      return {
        id: queryResult.rows[0].id,
        items: [],
      };
    }
    finally {
      await client.end();
    }
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: Cart): Promise<Cart> {
    const { id, ...rest } = await this.findOrCreateByUserId(userId);

    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      if (rest.items?.length) {
        await client.query({
          text: `DELETE FROM cart_items WHERE cart_id = $1`,
          values: [id]
        });
      }

      await Promise.all(items.map(item => client.query({
        text: `INSERT INTO cart_items (cart_id, product_id, count) VALUES ($1, $2, $3)`,
        values: [id, item.product.id, item.count]
      })));

      return {
        id,
        ...rest,
        items: items
      };
    }
    finally {
      await client.end();
    }
  }

  async removeByUserId(userId: string): Promise<void> {
    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      await client.query({
        text: `DELETE FROM carts WHERE user_id = $1`,
        values: [userId]
      });
    }
    finally {
      await client.end();
    }
  }

  async markOrdered(cartId: string): Promise<void> {
    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      await client.query({
        text: `UPDATE carts SET status = 'ORDERED' WHERE id = $1`,
        values: [cartId]
      });
    }
    finally {
      await client.end();
    }
  }
}
