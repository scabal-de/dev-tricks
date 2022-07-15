/**
 *  About:
 * classes
 * inheritance
 * static methods
 * abstract classes
 * singleton classes
 *
 */

abstract class Department {
  //the abstract classes cannot be instanced by themselves
  static fiscalYear = 2020;
  //   private readonly id: string;
  //   private name: string;
  protected employees: string[] = [];

  constructor(protected readonly id: string, public name: string) {
    // this.id = id;
    // this.name = n;
    // console.log(Department.fiscalYear);
  }

  static createEmployee(name: string) {
    return { name: name };
  }

  abstract describe(this: Department): void;

  addEmployee(employee: string) {
    //Validations
    // this.id = "d2";
    this.employees.push(employee);
  }

  printEmployeeInformation() {
    console.log(this.employees.length);
    console.log(this.employees);
  }
}

class ITDepartment extends Department {
  constructor(id: string, public admins: string[]) {
    super(id, "IT");
    this.admins = admins;
  }
  describe() {
    console.log("IT Department - ID: " + this.id);
  }
}

class AccountingDepartment extends Department {
  private lastReport: string;
  private static instance: AccountingDepartment;

  get mostRecentReport() {
    if (this.lastReport) {
      return this.lastReport;
    }
    throw new Error("No report found.");
  }

  set mostRecentReport(value: string) {
    if (!value) {
      throw new Error("Please pass in a valid value!");
    }
    this.addReport(value);
  }

  private constructor(id: string, private reports: string[]) {
    super(id, "Accountanting");
    this.lastReport = reports[0];
  }

  static getInstance() {
    if (AccountingDepartment.instance) {
      return this.instance;
    }
    this.instance = new AccountingDepartment("d2", []);
    return this.instance;
  }

  describe() {
    console.log("Accounting Department -ID: " + this.id);
  }

  addEmployee(name: string) {
    if (name === "Sam") {
      return;
    }
    this.employees.push(name);
  }

  addReport(text: string) {
    this.reports.push(text);
    this.lastReport = text;
  }

  printReports() {
    console.log(this.reports);
  }
}

const employee1 = Department.createEmployee("Samu"); //We can access departments static property from outside
console.log(employee1, Department.fiscalYear); //We can access departments static property from outside

const it = new ITDepartment("d1", ["Samuel"]); //we instantiate the class with the constructor to make use of it

it.addEmployee("Sam"); //data entry via function in class instance from Department class
it.addEmployee("Dan"); //data entry via function in class instance from Department class

// it.employees[2] = "Dan";

it.describe(); //class function call that returns a value
it.name = "New Name"; //name its a public property, so, we can access and edit from outside
it.printEmployeeInformation(); //Class function call

console.log(it);

// const accounting = new AccountingDepartment("d2", []);
const accounting = AccountingDepartment.getInstance(); //Verify that a class can only be instantiated once
const accounting2 = AccountingDepartment.getInstance();
console.log(accounting, accounting2);

accounting.mostRecentReport = "Year End Report"; //SETTER
accounting.addReport("Something went wrong"); //single function in the accountingDepartment class
console.log(accounting.mostRecentReport); //GETTER

accounting.addEmployee("Sam"); //data entry via function in class instance from Department class
accounting.addEmployee("Cabal"); //data entry via function in class instance from Department class

// accounting.printReports();
// accounting.printEmployeeInformation();
accounting.describe();
// const accountingCopy = { name: "DUMMY", describe: accounting.describe };

// accountingCopy.describe();
