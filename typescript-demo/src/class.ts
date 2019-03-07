abstract class Animal {
  private name: string

  public constructor (name: string) {
    this.name = name
  }

  public abstract sayHi(): string
}

class Cat extends Animal {
  public sayHi() {
    return 'eat'
  }
}

let cat = new Cat('Tom')

interface Alarm {
  alert(): string
}

interface Light {
  lightOn(): string
}

class Door {

}

class SecurityDoor extends Door implements Alarm {
  alert () {
    return 'SecurityDoor alert'
  }
}

class Car implements Alarm, Light {
  alert () {
    console.log('Car alert')
    return 'Car alert'
  }
  lightOn () {
    return 'linght On'
  }
}

interface Counter {
  (start: number): string;
  interval: number;
  reset(): void;
}

function getCounter (): Counter {
  let counter = <Counter>function (start: number) {};
  counter.interval = 123;
  counter.reset = function () {};
  return counter;
}

let c = getCounter();
c(10)
c.reset()
c.interval = 5.0

function createArray<T>(length: number, value: T): Array<T> {
  let result: T[] = [];
  for (let i = 0; i < length; i++) {
    result[i] = value;
  }
  return result;
}

createArray<string>(3, '3')

function swap<T, U>(tuple: [T, U]): [U, T] {
  return [tuple[1], tuple[0]];
}

interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

function copyFields<T extends U, U>(target: T, source: U): T {
  for (let id in source) {
    target[id] = (<T>source)[id];
  }

  return target;
}

let x = { a: 1, b: 2, c: 3, d: 4 };
copyFields(x, {b: 10, d: 20})

interface CreateArrayFunc<T> {
  (length: number, value: T): Array<T>;
}

let createArray2: CreateArrayFunc<any>;
createArray2 = function<T>(length: number, value: T): Array<T> {
  let result: T[] = [];
  for (let i = 0; i < length; i++) {
    result[i] = value;
  }
  return result;
}

class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}

let myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function(x, y) {return x + y; };

function createArray3<T = string>(length: number, value: T): Array<T> {
  let result: T[] = [];
  for (let i = 0; i < length; i++) {
    result[i] = value;
  }
  return result;
}

console.log(createArray3(4, 4))