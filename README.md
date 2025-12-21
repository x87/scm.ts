# scm.ts

A small TypeScript library providing helpful utilities for [CLEO Redux](https://github.com/cleolibrary/CLEO-Redux) scripts. Works with GTA III, Vice City and San Andreas.

Copy `scm.mts` next to your main script and then import necessary functions:

```js
import { SCM, Timer, Counter, VehiclePool, PedPool, ObjectPool, TextDraw } from "./scm.mts";
```

`scm.mts` requires `mem` [permission](https://re.cleo.li/docs/en/permissions.html). Your script name should include `[mem]`, or the CLEO config should allow `mem`.

---

- [Counter](#counter)
- [Timer](#timer)
- [SCM](#scm)
- [VehiclePool](#vehiclepool)
- [PedPool](#pedpool)
- [ObjectPool](#objectpool)
- [TextDraw](#textdraw)

## Counter

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

- `.type(number)` - 0 is a number (default), 1 is a bar
- `.slot(number)` - position on screen (1, 2, 3, or 4). Supported since VC.
- `.text(string)` - custom text for the counter label (empty by default)
- `.key(string)` - a GXT key for the counter label
- `.noFlash()` - don't flash the counter on appear (only in SA)

The following calls are equivalent:

```js
const counter = new Counter(50).type(1).slot(3).noFlash().display();
const counter = new Counter({ initialValue: 50, type: 1, slot: 3, noFlash: true }).display();
```

Customization methods can only be used before `.display()`. When `.display()` method is invoked it returns a new object with the following properties:

- `.value` - a getter/setter for the counter. Can be increased or decreased.

```js
counter.value += 1;
counter.value = 5;
counter.value--;
```

- `.clear()` - delete the counter

## Timer

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

- `.direction(number)` - 0 is a countup timer, 1 is a countdown timer (default). Supported since VC.
- `.beepTime(number)` - time when the timer makes a noise. Only in SA.
- `.text(string)` - custom text for the counter label (empty by default)
- `.key(string)` - a GXT key for the counter label

The following calls are equivalent:

```js
const timer = new Timer(5000).direction(0).text("TIME").display();
const timer = new Timer({ initialValue: 5000, direction: 0, text: "TIME" }).display();
```

Customization methods can only be used before `.display()`. When `.display()` method is invoked it returns a new object with the following properties:

- `.value` - a getter/setter for the timer. Can be increased or decreased. Note that in each frame the game automatically updates the timer value.

```js
timer.value += 1000;
timer.value = 5000;
timer.value -= 1000;
```

- `.freeze(boolean)` - pause/unpause the timer
- `.clear()` - delete the timer

## SCM

A static object with the following methods:

- `SCM.readVar(number)` - reads the value of the global variable with the given index

- `SCM.writeVar(number, number)` - writes a new value of the global variable with the given index

## VehiclePool

A static object with the following methods:

- `VehiclePool.getHandle(number)` - returns a Car handle for the given CVehicle instance address
- `VehiclePool.getAt(number)` - returns a CVehicle instance address for the given Car handle
- `VehiclePool.getEntities()` - returns an array of existing CVehicle instance addresses. Can be used to iterate over all existing cars

## PedPool

A static object with the following methods:

- `PedPool.getHandle(number)` - returns a Char handle for the given CPed instance address
- `PedPool.getAt(number)` - returns a CPed instance address for the given Char handle
- `PedPool.getEntities()` - returns an array of existing CPed instance addresses. Can be used to iterate over all existing peds

## ObjectPool

A static object with the following methods:

- `ObjectPool.getHandle(number)` - returns a ScriptObject handle for the given CObject instance address
- `ObjectPool.getAt(number)` - returns a CObject instance address for the given ScriptObject handle
- `ObjectPool.getEntities()` - returns an array of existing CObject instance addresses. Can be used to iterate over all existing objects

## TextDraw

A helper class to display custom text on screen.

```js
const text = new TextDraw().color("Red").pos(320, 200);

while (true) {
  wait(0);
  text.draw("Hello World!");
}
```

All methods (except `.draw()`) can be chained:

```js
new TextDraw()
  .color("Yellow")
  .bg("Black")
  .alignCenter()
  .font(2)
  .scale(1.0, 1.5)
  .uppercase()
  .pos("50%", "10%")
  .draw("MISSION PASSED");
```

### Color Methods

- `.color(r, g, b, a)` - set text color with RGBA values (`0`-`255`)
- `.color(name)` - set color by name: `"Red"`, `"Blue"`, `"Yellow"`, `"White"`, `"Black"`, etc.
- `.color("#RRGGBB")` or `.color("#RRGGBBAA")` - set color with hex string
- `.bg(r, g, b, a)` - set background color with RGBA values (`0`-`255`)
- `.bg(name)` - set background color by name: `"Red"`, `"Blue"`, `"Yellow"`, `"White"`, `"Black", etc.
- `.bg("#RRGGBB")` or `.bg("#RRGGBBAA")` - set background color with hex string
- `.noBg()` - disable background
- `.randomColor()` - set a random color
- `.opacity(value)` - set text alpha (`0`-`255` or `"0%"`-`"100%"`)

#### Dynamic Colors

- `.color(fn)` - set color with callback `(prevR, prevG, prevB, prevA) => [newR, newG, newB, newA]`
- `.opacity(fn)` - opacity with callback `(prevAlpha) => newAlpha`
- `.bg(fn)` - background color with callback `(prevR, prevG, prevB, prevA) => [newR, newG, newB, newA]`

### Position Methods

- `.pos(x, y)` - set position in units (`0`-`640` for X, `0`-`448` for Y) or percentage (`"50%"`, `"25%"`)
- `.x(value)` - set X position
- `.y(value)` - set Y position

#### Dynamic Position

- `.pos(fn)` - dynamic position with callback `(prevX, prevY) => [newX, newY]`
- `.x(fn)` - dynamic X position with callback `(prevX) => newX`
- `.y(fn)` - dynamic Y position with callback `(prevY) => newY`

### Alignment

- `.alignLeft()` - align text to left (default)
- `.alignCenter()` - center text
- `.alignRight()` - align text to right
- `.maxWidth(value)` - set max width in pixels or percentage

### Font & Scale

- `.font(number)` - set font style (0-3), corresponds to GTA fonts https://library.sannybuilder.com/#/sa?q=SET_TEXT_FONT
- `.scale(x, y)` - set text scale
- `.scaleX(value)` / `.scaleY(value)` - set individual scale
- `.uppercase()` - transform text to UPPERCASE
- `.lowercase()` - transform text to lowercase
- `.normalCase()` - keep original case

#### Dynamic Scale

- `.scale(fn)` - dynamic scale with callback `(prevScaleX, prevScaleY) => [newScaleX, newScaleY]`
- `.scaleX(fn)` - dynamic X scale with callback `(prevScaleX) => newScaleX`
- `.scaleY(fn)` - dynamic Y scale with callback `(prevScaleY) => newScale`

### Drawing

- `.draw(text)` - render text on screen. Must be called every frame with `wait 0`.

### Examples

Fade out effect:

```js
const fadeOut = new TextDraw().color("White").opacity((prev) => Math.max(0, prev - 1));
fadeOut.draw("Fading Out...");
```

Fade in effect:

```js
const fadeIn = new TextDraw()
  .color("White")
  .opacity(0)
  .opacity((prev) => Math.min(255, prev + 1));
fadeIn.draw("Fading In...");
```

Centered text:

```js
const centered = new TextDraw().x("50%").y("50%").alignCenter();
centered.draw("Centered!");
```

Bouncing DVD logo:

```js
let xVelocity = 1.0;
let yVelocity = 1.0;

const bouncer = new TextDraw()
  .x((prev) => {
    if (prev > 640 || prev < 0) xVelocity *= -1;
    return prev + xVelocity;
  })
  .y((prev) => {
    if (prev > 448 || prev < 0) yVelocity *= -1;
    return prev + yVelocity;
  });

bouncer.draw("DVD");
```

News ticker:

```js
const ticker = new TextDraw().y("95%").color("Red").maxWidth("100%").uppercase().bg("Black");
ticker.draw("Breaking news...");
```

Rainbow text effect:

```js
const rainbow = new TextDraw().color((_, __, ___, a) => {
  const time = Date.now() / 1000;
  const r = Math.floor((Math.sin(time + 0) + 1) * 127);
  const g = Math.floor((Math.sin(time + 2) + 1) * 127);
  const b = Math.floor((Math.sin(time + 4) + 1) * 127);
  return [r, g, b, a];
});

rainbow.draw("RAINBOW TEXT EFFECT");
```
