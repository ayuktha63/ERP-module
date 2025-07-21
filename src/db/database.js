const { Database } = require('sqlite3');
const util = require('util');

class DB {
  constructor(dbPath) {
    console.log('Opening database at:', dbPath);
    this.db = new Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('Connected to SQLite database');
        this.init();
      }
    });
    this.dbRun = util.promisify(this.db.run.bind(this.db));
    this.dbGet = util.promisify(this.db.get.bind(this.db));
    this.dbAll = util.promisify(this.db.all.bind(this.db));
  }

  async init() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT,
        category TEXT,
        unit TEXT,
        purchase_price REAL,
        sale_price REAL,
        stock INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        mobile TEXT UNIQUE,
        gstin TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        items TEXT,
        discount REAL,
        gst REAL,
        total REAL,
        date TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )`,
      `CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor TEXT,
        date TEXT,
        items TEXT,
        total REAL
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name TEXT,
        logo TEXT,
        gst_percentage REAL,
        units TEXT,
        invoice_footer TEXT,
        invoice_layout TEXT
      )`,
      `INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`,
      `INSERT OR IGNORE INTO settings (business_name, gst_percentage, units, invoice_footer, invoice_layout)
       VALUES ('My Business', 18.0, 'PCS,KG', 'Thank you!', 'default')`
    ];

    try {
      for (const query of queries) {
        console.log('Executing query:', query.split('\n')[0]);
        await this.dbRun(query);
      }
      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }

  async login(username, password) {
    try {
      const user = await this.dbGet(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
      );
      return user ? { id: user.id, role: user.role } : null;
    } catch (err) {
      console.error('Login error:', err);
      return null;
    }
  }

  async getProducts() {
    try {
      return await this.dbAll('SELECT * FROM products');
    } catch (err) {
      console.error('Get products error:', err);
      return [];
    }
  }

  async addProduct(product) {
    try {
      return await this.dbRun(
        'INSERT INTO products (code, name, category, unit, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [product.code, product.name, product.category, product.unit, product.purchase_price, product.sale_price, product.stock]
      );
    } catch (err) {
      console.error('Add product error:', err);
      throw err;
    }
  }

  async updateProduct(id, product) {
    try {
      return await this.dbRun(
        'UPDATE products SET code = ?, name = ?, category = ?, unit = ?, purchase_price = ?, sale_price = ?, stock = ? WHERE id = ?',
        [product.code, product.name, product.category, product.unit, product.purchase_price, product.sale_price, product.stock, id]
      );
    } catch (err) {
      console.error('Update product error:', err);
      throw err;
    }
  }

  async deleteProduct(id) {
    try {
      return await this.dbRun('DELETE FROM products WHERE id = ?', [id]);
    } catch (err) {
      console.error('Delete product error:', err);
      throw err;
    }
  }

  async getCustomers() {
    try {
      return await this.dbAll('SELECT * FROM customers');
    } catch (err) {
      console.error('Get customers error:', err);
      return [];
    }
  }

  async addCustomer(customer) {
    try {
      const existing = await this.dbGet('SELECT id FROM customers WHERE mobile = ?', [customer.mobile]);
      if (existing) {
        return { existing: true, id: existing.id };
      }
      const result = await this.dbRun(
        'INSERT INTO customers (name, mobile, gstin) VALUES (?, ?, ?)',
        [customer.name, customer.mobile, customer.gstin]
      );
      const inserted = await this.dbGet('SELECT id FROM customers WHERE mobile = ?', [customer.mobile]);
      return { existing: false, id: inserted.id };
    } catch (err) {
      console.error('Add customer error:', err);
      throw err;
    }
  }

  async findCustomerByMobile(mobile) {
    try {
      return await this.dbGet('SELECT * FROM customers WHERE mobile = ?', [mobile]);
    } catch (err) {
      console.error('Find customer error:', err);
      return null;
    }
  }

  async saveBill(bill) {
    try {
      // Validate stock before saving
      for (const item of bill.items) {
        const product = await this.dbGet('SELECT stock FROM products WHERE id = ?', [item.id]);
        if (!product) {
          throw new Error(`Product with ID ${item.id} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.name}: ${product.stock} available, ${item.quantity} requested`);
        }
      }

      // Start transaction
      await this.dbRun('BEGIN TRANSACTION');
      
      // Insert bill
      const result = await this.dbRun(
        'INSERT INTO bills (customer_id, items, discount, gst, total, date) VALUES (?, ?, ?, ?, ?, ?)',
        [bill.customer_id, JSON.stringify(bill.items), bill.discount, bill.gst, bill.total, bill.date]
      );

      // Update stock
      for (const item of bill.items) {
        await this.dbRun('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
      }

      // Commit transaction
      await this.dbRun('COMMIT');
      
      return result;
    } catch (err) {
      // Rollback transaction on error
      await this.dbRun('ROLLBACK').catch(rollbackErr => {
        console.error('Rollback error:', rollbackErr);
      });
      console.error('Save bill error:', err);
      throw err;
    }
  }

  async getBills() {
    try {
      return await this.dbAll('SELECT b.*, c.name, c.mobile FROM bills b JOIN customers c ON b.customer_id = c.id');
    } catch (err) {
      console.error('Get bills error:', err);
      return [];
    }
  }

  async addPurchase(purchase) {
    try {
      const result = await this.dbRun(
        'INSERT INTO purchases (vendor, date, items, total) VALUES (?, ?, ?, ?)',
        [purchase.vendor, purchase.date, JSON.stringify(purchase.items), purchase.total]
      );
      for (const item of purchase.items) {
        await this.dbRun('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.id]);
      }
      return result;
    } catch (err) {
      console.error('Add purchase error:', err);
      throw err;
    }
  }

  async getPurchases(filters = {}) {
    try {
      let query = 'SELECT * FROM purchases WHERE 1=1';
      const params = [];

      if (filters.vendor) {
        query += ' AND vendor LIKE ?';
        params.push(`%${filters.vendor}%`);
      }
      if (filters.from) {
        query += ' AND date >= ?';
        params.push(filters.from);
      }
      if (filters.to) {
        query += ' AND date <= ?';
        params.push(filters.to);
      }

      query += ' ORDER BY date DESC';
      return await this.dbAll(query, params);
    } catch (err) {
      console.error('Get purchases error:', err);
      return [];
    }
  }

  async getSalesReport(filters) {
    try {
      let query = 'SELECT b.*, c.name, c.mobile FROM bills b JOIN customers c ON b.customer_id = c.id WHERE 1=1';
      const params = [];
      if (filters.dateFrom) {
        query += ' AND date >= ?';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        query += ' AND date <= ?';
        params.push(filters.dateTo);
      }
      if (filters.productId) {
        query += ' AND items LIKE ?';
        params.push(`%${filters.productId}%`);
      }
      return await this.dbAll(query, params);
    } catch (err) {
      console.error('Get sales report error:', err);
      return [];
    }
  }

  async getDaybook(date) {
    try {
      const sales = (await this.dbGet('SELECT SUM(total) as total FROM bills WHERE date = ?', [date]))?.total || 0;
      const purchases = (await this.dbGet('SELECT SUM(total) as total FROM purchases WHERE date = ?', [date]))?.total || 0;
      return { sales, purchases, profit: sales - purchases };
    } catch (err) {
      console.error('Get daybook error:', err);
      return { sales: 0, purchases: 0, profit: 0 };
    }
  }

  async getSettings() {
    try {
      return await this.dbGet('SELECT * FROM settings WHERE id = 1');
    } catch (err) {
      console.error('Get settings error:', err);
      return {};
    }
  }

  async updateSettings(settings) {
    try {
      return await this.dbRun(
        'UPDATE settings SET business_name = ?, logo = ?, gst_percentage = ?, units = ?, invoice_footer = ?, invoice_layout = ? WHERE id = 1',
        [settings.business_name, settings.logo, settings.gst_percentage, settings.units, settings.invoice_footer, settings.invoice_layout]
      );
    } catch (err) {
      console.error('Update settings error:', err);
      throw err;
    }
  }

  close() {
    this.db.close((err) => {
      if (err) console.error('Database close error:', err);
      else console.log('Database connection closed');
    });
  }
}

module.exports = DB;