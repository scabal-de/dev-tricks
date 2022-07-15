module.exports = class Checkout {
  constructor() {
    this.prices = new Object();
    // this.total = 0;
    this.items = new Object();
    this.discounts = new Object();
  }

  addItemPrice(item, price) {
    this.prices[item] = price;
  }
  addItem(item) {
    if (this.prices[item] === undefined) {
      throw "No price defined for item " + item;
    }
    if (this.items[item] === undefined) {
      this.items[item] = 1;
    } else {
      this.items[item]++;
    }
  }
  calculateTotal() {
    let total = 0;
    for (let item in this.items) {
      total += this.calculateItemTotal(item);
    }
    return total;
  }

  calculateItemTotal(item) {
    let total = 0;
    let discount = this.discounts[item];
    if (discount != undefined) {
      total += this.calculateDiscont(item, this.items[item], discount);
    } else {
      total += this.prices[item] * this.items[item];
    }
    return total;
  }

  calculateDiscont(item, itemCnt, discount) {
    let total = 0;
    let nbrOfDiscounts = itemCnt / discount.cnt;
    total += nbrOfDiscounts * discount.price;
    let remainder = itemCnt % discount.cnt;
    total += remainder * this.prices[item];
    return total;
  }

  addDiscount(item, itemCnt, discountPrice) {
    this.discounts[item] = { cnt: itemCnt, price: discountPrice };
  }
};
