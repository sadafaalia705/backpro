import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse DATABASE_URL or use individual environment variables
const getDatabaseConfig = () => {
  // Check if DATABASE_URL is provided (preferred method)
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for database connection');
    return process.env.DATABASE_URL;
  }

  // Fallback to individual environment variables
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '9588593004@Vats';
  const database = process.env.DB_NAME || 'ha';

  console.log(`Using individual env vars: ${user}:***@${host}:${port}/${database}`);
  return {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    connectTimeout: 15000,
    timezone: 'Z',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };
};

// Create the pool with configuration
const dbConfig = getDatabaseConfig();
const pool = mysql.createPool(dbConfig);

// Enhanced connection pool event listeners
pool.on('connection', (connection) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('New connection created in pool (Thread ID:', connection.threadId + ')');
  }
  // Set session variables if needed
  connection.query('SET SESSION wait_timeout = 28800'); // 8 hours
});

pool.on('acquire', (connection) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Connection acquired (Thread ID:', connection.threadId + ')');
  }
});

pool.on('release', (connection) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Connection released (Thread ID:', connection.threadId + ')');
  }
});

pool.on('enqueue', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Waiting for available connection slot');
  }
});

// Enhanced connection test
async function testConnection() {
  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    let connection;
    try {
      console.log(`Testing database connection (attempt ${retryCount + 1}/${maxRetries})`);
      connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT NOW() as now, VERSION() as version');

      console.log('Database connection successful!');
      console.log('MySQL version:', rows[0].version);
      console.log('Connection time:', rows[0].now);
      console.log('Pool stats:', getPoolStats());

      break;
    } catch (err) {
      console.error(`Database connection failed (attempt ${retryCount + 1}/${maxRetries}):`, {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
      });

      retryCount++;

      if (retryCount === maxRetries) {
        console.error('🚨 Max retries reached. Database connection failed permanently.');
        process.exit(1);
      }

      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 100, 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      if (connection) connection.release();
    }
  }
}

// Initialize connection test
testConnection();

// Periodic health check
let healthCheckInterval;

function startHealthCheck() {
  healthCheckInterval = setInterval(async () => {
    let connection;
    try {
      const startTime = Date.now();
      connection = await pool.getConnection();
      await connection.query('SELECT 1');
      const duration = Date.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`Database health check successful (${duration}ms)`);
      }

      const stats = getPoolStats();
      if (stats.waitingCount > 0) {
        console.warn(`${stats.waitingCount} clients waiting for connections`, stats);
      }
      if (stats.totalCount >= 20 * 0.8) {
        console.warn(`Pool utilization high: ${stats.totalCount}/20`, stats);
      }
    } catch (err) {
      console.error('Periodic health check failed:', {
        message: err.message,
        code: err.code,
        timestamp: new Date().toISOString(),
      });

      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.log('Connection appears to be lost. Retesting...');
        testConnection();
      }
    } finally {
      if (connection) connection.release();
    }
  }, 300000); // 5 minutes
}

// Start health monitoring
startHealthCheck();

// Query function with retry logic
async function query(sql, params, options = {}) {
  const { retries = 3, timeout = 15000 } = options;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    let connection;
    try {
      const startTime = Date.now();
      connection = await Promise.race([
        pool.getConnection(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection acquisition timeout')), 10000)
        ),
      ]);

      // MySQL doesn't support native query timeouts, so we implement our own
      const queryPromise = connection.query(sql, params);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query execution timeout')), timeout)
      );

      const [rows] = await Promise.race([queryPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      if (duration > 5000 && process.env.NODE_ENV === 'development') {
        console.warn(`🐌 Slow query detected (${duration}ms):`, {
          query: sql.length > 100 ? sql.substring(0, 100) + '...' : sql,
          params: params ? params.length : 0,
          duration,
        });
      }

      return rows;
    } catch (error) {
      lastError = error;
      console.error(`Query attempt ${attempt}/${retries} failed:`, {
        message: error.message,
        code: error.code,
      });

      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 100, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } finally {
      if (connection) connection.release();
    }
  }

  throw lastError;
}

// Transaction function
async function transaction(callback, options = {}) {
  const { timeout = 30000 } = options;
  let connection;

  try {
    connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction connection timeout')), 10000)
      ),
    ]);

    await connection.beginTransaction();
    const result = await Promise.race([
      callback(connection),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction timeout')), timeout)
      ),
    ]);

    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', {
          message: rollbackError.message,
          code: rollbackError.code,
        });
      }
    }

    console.error('Transaction failed:', {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Get connection function with retry logic
async function getConnection(timeout = 10000, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Acquiring connection, attempt:', attempt, getPoolStats());
      }
      return await Promise.race([
        pool.getConnection(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection acquisition timeout')), timeout)
        ),
      ]);
    } catch (err) {
      console.error(`Connection acquisition failed (attempt ${attempt}/${retries}):`, err.message, getPoolStats());
      if (attempt === retries) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 100, 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  try {
    await Promise.race([
      pool.end(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Pool shutdown timeout')), 10000)),
    ]);
    console.log('Database pool closed successfully');
  } catch (err) {
    console.error('Error closing database pool:', err.message);
  }
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Pool stats function
function getPoolStats() {
  return {
    totalConnections: pool.totalConnections || 0,
    activeConnections: pool.activeConnections || 0,
    idleConnections: pool.idleConnections || 0,
    taskQueueSize: pool.taskQueue ? pool.taskQueue.length : 0,
    config: {
      connectionLimit: 20,
      queueLimit: 0,
      connectTimeout: 15000,
    },
  };
}

export { pool, query, transaction, getConnection, getPoolStats };