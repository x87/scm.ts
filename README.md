# scm.ts

A small TypeScript library providing helpful utilities for [CLEO Redux](https://github.com/cleolibrary/CLEO-Redux) scripts. Works with GTA III, Vice City and San Andreas. 

## Usage

Copy `scm.ts` next to your main script and then import necessary functions:

```js
  import { SCM, Timer, Counter } from './scm';
```

`scm.ts` requires `mem` [permission](https://re.cleo.li/docs/en/permissions.html). Your script name should include `[mem]`, or the CLEO config should allow `mem`.

## Classes

### Counter

A helper class to create and manipulate onscreen counters (can be one of the two types: bars and numbers).

```js
const counter = new Counter(350).type(0).display(); // create a new bar counter with initial value of 350
wait(1000);
counter.value -= 100; // decrement counter's value by 100
wait(1000);
counter.clear(); // delete counter
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

A helper class to create and manipulate onscreen timers.

```js
const timer = new Timer(10000).text("My Timer").display(); // create a new timer with initial time of 10 seconds and custom label
wait(1000);
timer.freeze(true); // temporarily pause the timer
wait(1000);
timer.freeze(false); // continue timer
wait(1000);
timer.clear(); // delete timer
```

`Timer` constructor accepts a number or an object:

- `new Timer(number)` - creates a new Timer with the initial time in ms
- `new Timer({ direction: number, beepTime: number, text: string, key: string, initialValue: number})` - creates a new Timer with the one or many given options.

Also `Timer` object has methods that can be chained to customize the visual style and behavior of the counter:

* `.direction(number)` - 0 is a countup timer, 1 is a countdown timer (default). Supported since VC.
* `.beepTime(number)` - time when the timer makes a noise. Only in SA.
* `.text(string)` - custom text for the counter label (empty by default)
* `.key(string)` - a GXT key for the counter label

The following calls are equivalent:

```js
const timer = new Timer(5000).direction(0).text("TIME").display();
const timer = new Timer({initialValue: 5000, direction: 0, text: 'TIME'}).display();
```

Customization methods can only be used before `.display()`. When `.display()` method is invoked it returns a new object with the following properties:

* `.value` - a getter/setter for the timer. Can be increased or decreased. Note that in each frame the game automatically updates the timer value.
```js
timer.value += 1000;
timer.value = 5000;
timer.value -= 1000;
```
* `.freeze(boolean)` - pause/unpause the timer
* `.clear()` - delete the timer

## SCM

A static object with the following methods:

* `SCM.readVar(number)` - reads the value of the global variable with the given index

* `SCM.writeVar(number, number)` - writes a new value of the global variable with the given index



