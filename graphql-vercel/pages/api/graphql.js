import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { Pool } from 'pg';

// ==========================================
// DATABASE
// ==========================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
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

  # ========================================
  # INPUT TYPES
  # ========================================

  input CreateProductInput {
    name: String!
    price: Float!
    stock: Int!
    categoryId: ID!
    ownerId: ID
  }

  input UpdateProductInput {
    name: String
    price: Float
    stock: Int
  }

  # ========================================
  # QUERY
  # ========================================

  type Query {
    users: [User]
    categories: [Category]
    products(categoryId: ID): [Product]
    orders: [Order]

    resolverCallCount: Int!
  }

  # ========================================
  # MUTATION
  # ========================================

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;

// ==========================================
// RESOLVERS
// ==========================================

const resolvers = {

  // ========================================
  // QUERY
  // ========================================

  Query: {

    // --------------------------------------
    // USERS
    // --------------------------------------

    users: async () => {
      const result = await pool.query(
        'SELECT * FROM users ORDER BY id'
      );

      return result.rows;
    },

    // --------------------------------------
    // CATEGORIES
    // --------------------------------------

    categories: async () => {
      const result = await pool.query(
        'SELECT * FROM categories ORDER BY id'
      );

      return result.rows;
    },

    // --------------------------------------
    // PRODUCTS
    // --------------------------------------

    products: async (_, { categoryId }) => {

      if (categoryId) {
        const result = await pool.query(
          `
          SELECT *
          FROM products
          WHERE category_id = $1
          ORDER BY id
          `,
          [categoryId]
        );

        return result.rows;
      }

      const result = await pool.query(
        `
        SELECT *
        FROM products
        ORDER BY id
        `
      );

      return result.rows;
    },

    // --------------------------------------
    // ORDERS
    // --------------------------------------

    orders: async () => {
      const result = await pool.query(
        'SELECT * FROM orders ORDER BY id'
      );

      return result.rows;
    },

    // --------------------------------------
    // RESOLVER COUNTER
    // --------------------------------------

    resolverCallCount: async () => {

      const result = await pool.query(
        'SELECT COUNT(*) FROM categories'
      );

      const count = Number(result.rows[0].count);

      console.log(
        `Jumlah category yang diproses: ${count}`
      );

      return count;
    },
  },

  // ========================================
  // CATEGORY
  // ========================================

  Category: {

    products: async (parent) => {

      console.log(
        `Category.products dipanggil untuk category_id=${parent.id}`
      );

      const result = await pool.query(
        `
        SELECT *
        FROM products
        WHERE category_id = $1
        ORDER BY id
        `,
        [parent.id]
      );

      return result.rows;
    },
  },

  // ========================================
  // PRODUCT
  // ========================================

  Product: {

    owner: async (parent) => {

      if (!parent.owner_id) {
        return null;
      }

      const result = await pool.query(
        `
        SELECT *
        FROM users
        WHERE id = $1
        `,
        [parent.owner_id]
      );

      return result.rows[0] || null;
    },
  },

  // ========================================
  // ORDER
  // ========================================

  Order: {

    user: async (parent) => {

      if (!parent.user_id) {
        return null;
      }

      const result = await pool.query(
        `
        SELECT *
        FROM users
        WHERE id = $1
        `,
        [parent.user_id]
      );

      return result.rows[0] || null;
    },

    product: async (parent) => {

      if (!parent.product_id) {
        return null;
      }

      const result = await pool.query(
        `
        SELECT *
        FROM products
        WHERE id = $1
        `,
        [parent.product_id]
      );

      return result.rows[0] || null;
    },
  },

  // ========================================
  // MUTATION
  // ========================================

  Mutation: {

    // ======================================
    // CREATE PRODUCT
    // ======================================

    createProduct: async (_, { input }) => {

      const result = await pool.query(
        `
        INSERT INTO products
          (name, price, stock, category_id, owner_id)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
          input.name,
          input.price,
          input.stock,
          input.categoryId,
          input.ownerId || null,
        ]
      );

      return result.rows[0];
    },

    // ======================================
    // UPDATE PRODUCT
    // ======================================

    updateProduct: async (_, { id, input }) => {

      const result = await pool.query(
        `
        UPDATE products
        SET
          name = COALESCE($1, name),
          price = COALESCE($2, price),
          stock = COALESCE($3, stock)
        WHERE id = $4
        RETURNING *
        `,
        [
          input.name ?? null,
          input.price ?? null,
          input.stock ?? null,
          id,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(
          `Product dengan id ${id} tidak ditemukan`
        );
      }

      return result.rows[0];
    },

    // ======================================
    // DELETE PRODUCT
    // ======================================

    deleteProduct: async (_, { id }) => {

      const result = await pool.query(
        `
        DELETE FROM products
        WHERE id = $1
        `,
        [id]
      );

      return result.rowCount > 0;
    },
  },
};

// ==========================================
// APOLLO SERVER
// ==========================================

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// ==========================================
// NEXT.JS HANDLER
// ==========================================

const handler = startServerAndCreateNextHandler(server);

// ==========================================
// API HANDLER + CORS
// ==========================================

export default async function graphqlHandler(req, res) {

  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Apollo-Require-Preflight'
  );

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return handler(req, res);
}
