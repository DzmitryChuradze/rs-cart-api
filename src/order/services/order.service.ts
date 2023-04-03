import { Injectable } from '@nestjs/common';
import { CartService } from 'cart';
import { Client } from 'pg';
import { PG_CLIENT_CONFIG } from '../../constants';
import { Order } from '../models';

@Injectable()
export class OrderService {
  constructor(private readonly cartService: CartService) { }

  async findById(orderId: string): Promise<Order> {
    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      const queryResult = await client.query({
        text: `SELECT o.*, c.user_id FROM orders o JOIN carts c ON o.cart_id = c.id WHERE id = $1`,
        values: [orderId]
      });

      const order = queryResult.rows?.[0];

      if (order) {
        const cart = await this.cartService.findByUserId(order.user_id)

        return {
          id: order.id,
          userId: order.user_id,
          cartId: cart.id,
          items: cart.items,
          payment: JSON.parse(order.payment),
          delivery: JSON.parse(order.delivery),
          comments: order.comments,
          status: order.status,
          total: order.total
        };
      }
    }
    finally {
      await client.end();
    }
  }

  async create(order: Order): Promise<Order> {
    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      const status = 'inProgress';

      const queryResult = await client.query({
        text: `INSERT INTO orders (cart_id, payment, delivery, comments, status, total) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        values: [order.cartId, JSON.stringify(order.payment), JSON.stringify(order.delivery), order.comments, status, order.total]
      });

      return {
        ...order,
        id: queryResult.rows[0].id,
        status: status
      };
    }
    finally {
      await client.end();
    }
  }

  async update(orderId: string, data: Order): Promise<void> {
    const order = await this.findById(orderId);

    if (!order) {
      throw new Error('Order does not exist.');
    }

    const client = new Client(PG_CLIENT_CONFIG);

    await client.connect();

    try {
      await client.query({
        text: `UPDATE orders
               SET payment = $2,
                   delivery = $3,
                   comments = $4,
                   status = $5,
                   total = $6
               WHERE id = $1`,
        values: [orderId, JSON.stringify(data.payment), JSON.stringify(data.delivery), data.comments, data.status, data.total]
      });
    }
    finally {
      await client.end();
    }
  }
}
