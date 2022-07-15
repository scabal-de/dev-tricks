/**
 * Interface:
 *  Describes the structure of an object
 *  also can be used to define the structure of a function
 */

// type AddFn = (a: number, b: number) => number;
//Interface as a function structure (custom type)
interface AddFn {
  (a: number, b: number): number;
}
let add: AddFn;
add = (n1: number, n2: number) => {
  return n1 + n2;
};

interface Named {
  readonly name: string;
  outputName?: string; //Optional property
}

interface Nicknamed {
  nickname?: string;
}

//We can extend multiple interfaces, but with classes this is not possible
interface Greetable extends Named, Nicknamed {
  // name: string;
  greet(phrase: string): void;
}

// class Person implements Greetable, AnyOtherInterface {}
class Person implements Greetable {
  // name: string;
  nickname?: string;
  age = 30;

  // constructor(public name: string, nick: string = '') //Default value
  constructor(public name: string, nick?: string) {
    if (nick) {
      this.nickname = nick;
    }
  }

  greet(phrase: string) {
    console.log(`${phrase} ${this.name} ${this.nickname ? this.nickname : ""}`);
  }
}

let user1: Greetable;
user1 = new Person("Sam", "ObjectNull");
user1.greet("Hi there - I am");
user1 = new Person("Sam");
user1.greet("Hi there - I am");
// user1.name = "Samuel";

console.log(user1);
