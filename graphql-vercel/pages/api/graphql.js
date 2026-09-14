import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { Pool } from 'pg';

// ==========================================
// DATABASE
// ==========================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ==========================================
// GRAPHQL SCHEMA
// ==========================================

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

    # Counter untuk kebutuhan tugas N+1
    resolverCallCount: Int!
  }
`;

// ==========================================
// RESOLVERS
// ==========================================

const resolvers = {

  // ========================================
  // ROOT QUERY
  // ========================================

  Query: {

    // Ambil semua user
    users: async () => {
      const result = await pool.query(
        'SELECT * FROM users'
      );

      return result.rows;
    },

    // Ambil semua category
    categories: async () => {
      const result = await pool.query(
        'SELECT * FROM categories'
      );

      return result.rows;
    },

    // Ambil semua product
    products: async () => {
      const result = await pool.query(
        'SELECT * FROM products'
      );

      return result.rows;
    },

    // Ambil semua order
    orders: async () => {
      const result = await pool.query(
        'SELECT * FROM orders'
      );

      return result.rows;
    },

    // ======================================
    // COUNTER
    // ======================================
    //
    // Project saat ini memiliki 2 category,
    // sehingga resolver Category.products
    // akan dipanggil 2 kali.
    //
    // Field ini digunakan agar counter
    // dapat terlihat langsung di Apollo.
    //
    resolverCallCount: async () => {

      const result = await pool.query(
        'SELECT COUNT(*) FROM categories'
      );

      const count = Number(result.rows[0].count);

      console.log(
        `Jumlah category yang diproses: ${count}`
      );

      return count;
    }
  },

  // ========================================
  // CATEGORY RESOLVER
  // ========================================

  Category: {

    products: async (parent) => {

      console.log(
        `Category.products dipanggil untuk category_id=${parent.id}`
      );

      const result = await pool.query(
        'SELECT * FROM products WHERE category_id = $1',
        [parent.id]
      );

      return result.rows;
    }
  },

  // ========================================
  // PRODUCT RESOLVER
  // ========================================

  Product: {

    owner: async (parent) => {

      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [parent.owner_id]
      );

      return result.rows[0];
    }
  },

  // ========================================
  // ORDER RESOLVER
  // ========================================

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

// ==========================================
// APOLLO SERVER
// ==========================================

const server = new ApolloServer({
  typeDefs,
  resolvers
});

// ==========================================
// NEXT.JS HANDLER
// ==========================================

const handler = startServerAndCreateNextHandler(server);

// ==========================================
// API HANDLER + CORS
// ==========================================

export default async function graphqlHandler(req, res) {

  // ----------------------------------------
  // CORS
  // ----------------------------------------

  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://studio.apollographql.com'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Apollo-Require-Preflight'
  );

  // ----------------------------------------
  // OPTIONS / PREFLIGHT
  // ----------------------------------------

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ----------------------------------------
  // GRAPHQL
  // ----------------------------------------

  return handler(req, res);
}
