export interface Product {
  id: number;
  name: string;
  emoji: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  maxStock: number;
  popularity: number;
  shelfPosition?: number;
}

export interface Customer {
  id: number;
  name: string;
  patience: number;
  maxPatience: number;
  cart: Product[];
  budget: number;
}

export interface SuperMarketState {
  money: number;
  reputation: number;
  day: number;
  customers: Customer[];
  products: Product[];
  totalSales: number;
  totalCustomers: number;
  dailyProfit: number;
  isOpen: boolean;
}

export class SuperMarketEngine {
  private state: SuperMarketState;
  private customerNames = [
    '张三', '李四', '王五', '赵六', '钱七',
    '孙八', '周九', '吴十', '郑一', '陈二'
  ];

  public productTypes = [
    { name: '面包', emoji: '🍞', price: 8, cost: 3, category: '食品', popularity: 90, maxStock: 30 },
    { name: '牛奶', emoji: '🥛', price: 12, cost: 5, category: '食品', popularity: 85, maxStock: 25 },
    { name: '鸡蛋', emoji: '🥚', price: 15, cost: 6, category: '食品', popularity: 80, maxStock: 20 },
    { name: '苹果', emoji: '🍎', price: 6, cost: 2, category: '水果', popularity: 75, maxStock: 40 },
    { name: '香蕉', emoji: '🍌', price: 5, cost: 2, category: '水果', popularity: 70, maxStock: 35 },
    { name: '薯片', emoji: '🍟', price: 10, cost: 4, category: '零食', popularity: 65, maxStock: 30 },
    { name: '可乐', emoji: '🥤', price: 8, cost: 3, category: '饮料', popularity: 85, maxStock: 40 },
    { name: '矿泉水', emoji: '💧', price: 3, cost: 1, category: '饮料', popularity: 90, maxStock: 50 },
    { name: '洗发水', emoji: '🧴', price: 35, cost: 15, category: '日用品', popularity: 50, maxStock: 15 },
    { name: '牙膏', emoji: '🪥', price: 20, cost: 8, category: '日用品', popularity: 60, maxStock: 20 },
    { name: '纸巾', emoji: '🧻', price: 15, cost: 6, category: '日用品', popularity: 75, maxStock: 25 },
    { name: '啤酒', emoji: '🍺', price: 25, cost: 10, category: '酒水', popularity: 55, maxStock: 20 },
  ];

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): SuperMarketState {
    const products: Product[] = this.productTypes.map((type, index) => ({
      id: index,
      ...type,
      stock: Math.floor(Math.random() * 10) + 10,
      shelfPosition: index,
    }));

    return {
      money: 5000,
      reputation: 50,
      day: 1,
      customers: [],
      products,
      totalSales: 0,
      totalCustomers: 0,
      dailyProfit: 0,
      isOpen: false,
    };
  }

  public start(): void {
    this.state = this.getInitialState();
  }

  public openStore(): void {
    this.state.isOpen = true;
    this.state.dailyProfit = 0;
  }

  public closeStore(): void {
    this.state.isOpen = false;
    this.state.day++;
    this.updateReputation();
  }

  private updateReputation(): void {
    const avgStock = this.state.products.reduce((sum, p) => sum + (p.stock / p.maxStock), 0) / this.state.products.length;
    const stockBonus = avgStock > 0.5 ? 2 : avgStock > 0.2 ? 0 : -3;
    this.state.reputation = Math.max(0, Math.min(100, this.state.reputation + stockBonus));
  }

  public spawnCustomer(): void {
    if (!this.state.isOpen || this.state.customers.length >= 5) return;

    const customer: Customer = {
      id: Date.now() + Math.random(),
      name: this.customerNames[Math.floor(Math.random() * this.customerNames.length)],
      patience: 30 + Math.random() * 20,
      maxPatience: 50,
      cart: [],
      budget: 50 + Math.random() * 100,
    };

    const availableProducts = this.state.products.filter(p => p.stock > 0);
    const productCount = Math.floor(Math.random() * 4) + 1;

    for (let i = 0; i < productCount && availableProducts.length > 0; i++) {
      const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
      if (customer.budget >= product.price && product.stock > 0) {
        customer.cart.push(product);
        customer.budget -= product.price;
      }
    }

    if (customer.cart.length > 0) {
      this.state.customers.push(customer);
      this.state.totalCustomers++;
    }
  }

  public updateCustomers(deltaTime: number): void {
    this.state.customers.forEach(customer => {
      customer.patience -= deltaTime / 100;
    });

    this.state.customers = this.state.customers.filter(customer => {
      if (customer.patience <= 0) {
        return false;
      }
      return true;
    });
  }

  public checkoutCustomer(customerId: number): boolean {
    const customerIndex = this.state.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return false;

    const customer = this.state.customers[customerIndex];
    let total = 0;

    for (const product of customer.cart) {
      const storeProduct = this.state.products.find(p => p.id === product.id);
      if (storeProduct && storeProduct.stock > 0) {
        storeProduct.stock--;
        total += storeProduct.price;
      }
    }

    if (total > 0) {
      this.state.money += total;
      this.state.totalSales += total;
      this.state.dailyProfit += total;
      this.state.customers.splice(customerIndex, 1);
      return true;
    }

    return false;
  }

  public restockProduct(productId: number): boolean {
    const product = this.state.products.find(p => p.id === productId);
    if (!product) return false;

    const costPerUnit = product.cost;
    const restockAmount = Math.min(10, product.maxStock - product.stock);
    const totalCost = restockAmount * costPerUnit;

    if (this.state.money >= totalCost && restockAmount > 0) {
      this.state.money -= totalCost;
      product.stock += restockAmount;
      return true;
    }

    return false;
  }

  public buyProduct(productId: number): boolean {
    const product = this.state.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return false;

    if (this.state.money >= product.cost) {
      this.state.money -= product.cost;
      product.stock++;
      return true;
    }

    return false;
  }

  public getState(): SuperMarketState {
    return { ...this.state };
  }

  public getProducts(): Product[] {
    return [...this.state.products];
  }

  public getCustomers(): Customer[] {
    return [...this.state.customers];
  }

  public getLowStockProducts(): Product[] {
    return this.state.products.filter(p => p.stock < p.maxStock * 0.3);
  }

  public getDailyReport(): { sales: number; profit: number; reputation: number } {
    const profit = this.state.dailyProfit - this.state.products.reduce((sum, p) => {
      const currentStock = p.stock;
      return sum;
    }, 0);

    return {
      sales: this.state.totalSales,
      profit: this.state.dailyProfit,
      reputation: this.state.reputation,
    };
  }
}
