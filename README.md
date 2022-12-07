# scm.js

A small Javacript library providing helpful utilites for [CLEO Redux](https://github.com/cleolibrary/CLEO-Redux) scripts. Works with GTA III, Vice City and San Andreas. 

## Usage

Copy `scm.js` next to your main script and then import necessary functions:

```js
  import { SCM, Timer, Counter } from './scm';
```

## Classes

### Counter

A helper class to create and manipulate onscreen counters (can be one of the two types: bars and numbers).

```js
const counter = new Counter(350).type(0).display(); // create a new bar counter with initial value of 350
wait(1000);
c.value -= 100; // decrement counter's value by 100
wait(1000);
c.clear(); // delete counter
```

`Counter` constructor accepts a number or an object:

- `new Counter(number)` - creates a new Counter with the initial value
- `new Counter({ type: number, slot: number, text: string, key: string, noFlash: boolean, initialValue: number})` - creates a new Counter with the one or many given options.

Also `Counter` object has methods that can be chained to customize the visual style and behavior of the counter:

* `.type(number)` - 0 is a number (default), 1 is a bar
* `.slot(number)` - position on screen (1, 2, 3, or 4). Supported since VC.
* `.text(string)` - custom text for the counter label (empty by default)
* `.key(string)` - a GXT key for the counter label
* `.noFlash()` - don't flash the counter on appear (only in SA)

The following calls are equivalent:

```js
const counter = new Counter(50).type(1).slot(3).noFlash().display();
const counter = new Counter({initialValue: 50, type: 1, slot: 3, noFlash: true}).display();
```

Customization methods can only be used before `.display()`. When `.display()` method is invoked it returns a new object with the following properties:

* `.value` - a getter/setter for the counter. Can be increased or decreased.
```js
counter.value += 1;
counter.value = 5;
counter.value--;
```
* `.clear()` - delete the counter


### Timer

TBD

## SCM

A static object with the following methods:

* `SCM.readVar(id)` - reads the value of the global variable with `id`

* `SCM.writeVar(id, value)` - writes a new value of the global variable with `id`



