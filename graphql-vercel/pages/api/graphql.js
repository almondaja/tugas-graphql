import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { Pool } from 'pg';

// Koneksi ke Database Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Counter untuk menghitung pemanggilan resolver Category.products
let resolverCallCount = 0;

// Schema GraphQL
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Category {
    id: ID!
    name: String!
    products: [Product]
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    owner: User
  }

  type Order {
    id: ID!
    quantity: Int!
    total_price: Float!
    user: User
    product: Product
  }

  type Query {
    users: [User]
    categories: [Category]
    products: [Product]
    orders: [Order]
    resolverCallCount: Int!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users: async () => {
      const result = await pool.query('SELECT * FROM users');
      return result.rows;
    },
  
    categories: async () => {
      const result = await pool.query('SELECT * FROM categories');
      return result.rows;
    },
  
    products: async () => {
      const result = await pool.query('SELECT * FROM products');
      return result.rows;
    },
  
    orders: async () => {
      const result = await pool.query('SELECT * FROM orders');
      return result.rows;
    },
  
    resolverCallCount: async () => {
      const result = await pool.query('SELECT COUNT(*) FROM categories');
      return Number(result.rows[0].count);
    },
  },

  Category: {
    products: async (parent) => {
      resolverCallCount++;

      console.log(
        `Category.products dipanggil untuk category_id=${parent.id}. Total pemanggilan: ${resolverCallCount}`
      );

      const result = await pool.query(
        'SELECT * FROM products WHERE category_id = $1',
        [parent.id]
      );

      return result.rows;
    }
  },

  Product: {
    owner: async (parent) => {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [parent.owner_id]
      );

      return result.rows[0];
    }
  },

  Order: {
    user: async (parent) => {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [parent.user_id]
      );

      return result.rows[0];
    },

    product: async (parent) => {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [parent.product_id]
      );

      return result.rows[0];
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export default async function graphqlHandler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://studio.apollographql.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Apollo-Require-Preflight'
  );

  // Handle Apollo Studio preflight request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return handler(req, res);
}
