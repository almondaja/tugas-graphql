import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    products: [Product!]!
    orders: [Order!]!
  }

  type Category {
    id: ID!
    name: String!
    products: [Product!]!
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    category: Category!
    owner: User!
  }

  type Order {
    id: ID!
    quantity: Int!
    total_price: Float!
    user: User!
    product: Product!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    categories: [Category!]!
    category(id: ID!): Category
    products: [Product!]!
    product(id: ID!): Product
    orders: [Order!]!
  }
`;

const resolvers = {
  Query: {
    users: async () => (await pool.query('SELECT * FROM users')).rows,
    user: async (_, { id }) => (await pool.query('SELECT * FROM users WHERE id = $1', [id])).rows[0],
    categories: async () => (await pool.query('SELECT * FROM categories')).rows,
    category: async (_, { id }) => (await pool.query('SELECT * FROM categories WHERE id = $1', [id])).rows[0],
    products: async () => (await pool.query('SELECT * FROM products')).rows,
    product: async (_, { id }) => (await pool.query('SELECT * FROM products WHERE id = $1', [id])).rows[0],
    orders: async () => (await pool.query('SELECT * FROM orders')).rows
  },
  User: {
    products: async (parent) => (await pool.query('SELECT * FROM products WHERE owner_id = $1', [parent.id])).rows,
    orders: async (parent) => (await pool.query('SELECT * FROM orders WHERE user_id = $1', [parent.id])).rows
  },
  Category: {
    products: async (parent) => (await pool.query('SELECT * FROM products WHERE category_id = $1', [parent.id])).rows
  },
  Product: {
    category: async (parent) => (await pool.query('SELECT * FROM categories WHERE id = $1', [parent.category_id])).rows[0],
    owner: async (parent) => (await pool.query('SELECT * FROM users WHERE id = $1', [parent.owner_id])).rows[0]
  },
  Order: {
    user: async (parent) => (await pool.query('SELECT * FROM users WHERE id = $1', [parent.user_id])).rows[0],
    product: async (parent) => (await pool.query('SELECT * FROM products WHERE id = $1', [parent.product_id])).rows[0]
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

export default startServerAndCreateNextHandler(server, {
  context: async (req, res) => ({ req, res }),
});