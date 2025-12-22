// SCM.ts v0.4.1

assertCleoVersion("1.0.5");
assert(isGTA3() || isVC() || isSA(), "Unsupported game");

// -- SCM

const mainScm = Memory.Translate("CTheScripts::ScriptSpace");
assert(mainScm > 0, "Main.scm address not found");

if (["re3", "reVC"].includes(HOST)) {
  // disable assert in re3 and reVC
  const fn = Memory.Translate("CTheScripts::GetPointerToScriptVariable");
  Memory.WriteU32(fn + 0, 0x0424448b, true); // mov eax, [esp+4]
  Memory.WriteU16(fn + 4, 0x808d, true); // lea eax, CTheScripts::ScriptSpace[eax]
  Memory.WriteU32(fn + 6, mainScm, true);
  Memory.WriteU8(fn + 10, 0xc3, true); // ret
}

const counters = (Memory.ReadI32(mainScm + 3, false, false) + 12) / 4;

const SCM = {
  readVar(id: number) {
    assertVar(id);
    return Memory.ReadI32(mainScm + id * 4, false, false);
  },

  writeVar(id: number, value: number) {
    assertVar(id);
    return Memory.WriteI32(mainScm + id * 4, value, false, false);
  },

  bind<T>(scmVariables: T): T {
    return Object.defineProperties(
      { ...scmVariables },
      Object.fromEntries(
        Object.entries(scmVariables).map(([key, varId]) => [
          key,
          {
            get() {
              const value = SCM.readVar(+varId);
              if (typeof scmVariables[key] === 'object') {
                // wrap the handle in a class instance
                return new scmVariables[key].__proto__.constructor(value);
              }
              return value;
            },
            set(value: number) {
              SCM.writeVar(+varId, +value);
            },
          },
        ]),
      ),
    );
  },

};

// -- Counters & Timers --

class DisplayedValue {
  constructor(protected _id: number, initialValue: number, protected _customKey: string) {
    this.value = initialValue;
  }
  get value() {
    return SCM.readVar(this._id);
  }
  set value(value) {
    SCM.writeVar(this._id, value);
  }
}

class DisplayedCounter extends DisplayedValue {
  clear() {
    if (this._customKey) {
      FxtStore.delete(this._customKey, true);
    }
    Hud.ClearCounter(this._id);
  }
}

class DisplayedTimer extends DisplayedValue {
  clear() {
    if (this._customKey) {
      FxtStore.delete(this._customKey, true);
    }
    Hud.ClearTimer(this._id);
  }
  freeze(state: boolean) {
    Hud.FreezeTimer(state);
  }
}

interface CounterProps {
  type?: number;
  slot?: number;
  text?: string;
  key?: string;
  noFlash?: boolean;
  initialValue?: number;
}

class Counter {
  private _type = 0;
  private _slot = 1;
  private _text = "";
  private _key: string;
  private _noFlash: boolean;
  private _initialValue = 0;

  constructor(props: number | CounterProps = 0) {
    if (typeof props === "object") {
      const { type, slot, text, key, noFlash, initialValue = 0 } = props;
      type && this.type(type);
      slot && this.slot(slot);
      text && this.text(text);
      key && this.key(key);
      noFlash && this.noFlash();
      this._initialValue = initialValue;
    } else {
      this._initialValue = props;
    }
  }
  type(type: number) {
    this._type = type;
    return this;
  }
  slot(value: number) {
    let slot = Number(value);
    if (slot < 1 || isGTA3()) {
      slot = 1;
    } else if (slot > 4) {
      slot = 4;
    }
    this._slot = slot;
    return this;
  }
  text(text: string) {
    this._text = text ?? "";
    return this;
  }
  key(key: string) {
    this._key = key;
    return this;
  }
  noFlash() {
    this._noFlash = true;
    return this;
  }

  display() {
    let customKey = "";
    if (!this._key) {
      customKey = `__cnts${this._slot}`;
      this.key(customKey);
      FxtStore.insert(this._key, this._text, true);
    }

    const id = counters + this._slot;

    if (isGTA3()) {
      Hud.DisplayCounterWithString(id, this._type, this._key);
    } else {
      Hud.DisplayNthCounterWithString(id, this._type, this._slot, this._key);
    }

    if (isSA() && this._noFlash) {
      Hud.SetCounterFlashWhenFirstDisplayed(id, false);
    }

    return new DisplayedCounter(id, this._initialValue, customKey);
  }
}

interface TimerProps {
  direction?: number;
  beepTime?: number;
  text?: string;
  key?: string;
  initialValue?: number;
}

class Timer {
  private _direction = 1;
  private _beepTime: number;
  private _text = "";
  private _key: string;
  private _initialValue = 0;

  constructor(props: number | TimerProps = 0) {
    if (typeof props === "object") {
      const { direction, beepTime, text, key, initialValue = 0 } = props;
      this.direction(direction ?? 1);
      beepTime && this.beepTime(beepTime);
      text && this.text(text);
      key && this.key(key);
      this._initialValue = initialValue;
    } else {
      this._initialValue = props;
    }
  }
  direction(direction: number) {
    this._direction = direction;
    return this;
  }
  beepTime(value: number) {
    if (!isSA()) {
      return this;
    }
    let beepTime = Number(value);
    this._beepTime = beepTime < 0 ? 0 : beepTime;
    return this;
  }
  text(text: string) {
    this._text = text ?? "";
    return this;
  }
  key(key: string) {
    this._key = key;
    return this;
  }

  display() {
    const slot = 0;
    const id = counters + slot;
    let customKey = "";

    if (!this._key) {
      customKey = `__cnts${slot}`;
      this.key(customKey);
      FxtStore.insert(this._key, this._text, true);
    }

    if (isGTA3()) {
      Hud.DisplayTimerWithString(id, this._key);
    } else {
      Hud.DisplayTimerWithString(id, this._direction, this._key);
    }
    if (isSA() && this._beepTime) {
      Hud.SetTimerBeepCountdownTime(id, this._beepTime);
    }

    return new DisplayedTimer(id, this._initialValue, customKey);
  }
}

class Pool {
  private entities: number;
  private flags: number;
  private size: number;
  private entitySize: number;

  constructor(type: Function) {
    // https://gist.github.com/x87/56f63042576df7a2426181a1592de352
    const map = {
      re3: [
        [Memory.Translate("CPools::ms_pVehiclePool"), 0x5a8],
        [Memory.Translate("CPools::ms_pPedPool"), 0x5f4],
        [Memory.Translate("CPools::ms_pObjectPool"), 0x1b0],
      ],
      reVC: [
        [Memory.Translate("CPools::ms_pVehiclePool"), 0x5dc],
        [Memory.Translate("CPools::ms_pPedPool"), 0x6d8],
        [Memory.Translate("CPools::ms_pObjectPool"), 0x1a0],
      ],
      gta3: [
        [0x009430dc, 0x5a8],
        [0x008f2c60, 0x5f0],
        [0x00880e28, 0x19c],
      ],
      vc: [
        [0x00a0fde4, 0x5dc],
        [0x0097f2ac, 0x6d8],
        [0x0094dbe0, 0x1a0],
      ],
      sa: [
        [0x00b74494, 0xa18],
        [0x00b74490, 0x7c4],
        [0x00b7449c, 0x19c],
      ],
    };
    const typeId = this.getTypeIndex(type);
    let [addr, entitySize] = map[HOST][typeId];
    this.init(Memory.ReadU32(addr, false), entitySize);
  }

  getHandle(struct: int) {
    const index = (struct - this.entities) / this.entitySize;
    return index * 256 + this.getFlag(index);
  }

  getAt(handle: int) {
    const index = handle >> 8;
    const flag = this.getFlag(index);
    if (index >= 0 && index < this.size && flag === (handle & 0xff)) {
      return this.getEntity(index);
    }
    return 0;
  }

  getEntity(index: int) {
    return this.entities + index * this.entitySize;
  }

  getEntities() {
    var result = [];
    for (var i = 0; i < this.size; i++) {
      const isFree = this.getFlag(i) & 0x80;
      if (!isFree) {
        result.push(this.getEntity(i));
      }
    }
    return result;
  }

  private init(addr: number, entitySize: number) {
    this.entities = Memory.ReadU32(addr + 0, false);
    this.flags = Memory.ReadU32(addr + 4, false);
    this.size = Memory.ReadI32(addr + 8, false);
    this.entitySize = entitySize;
  }

  private getTypeIndex(klass: Function) {
    if (klass === Car) {
      return 0;
    }
    if (klass === Char) {
      return 1;
    }
    if (klass === ScriptObject) {
      return 2;
    }
    throw new Error("Unknown type");
  }

  private getFlag(index: int) {
    return Memory.ReadU8(this.flags + index, false);
  }
}

const VehiclePool = new Pool(Car);
const PedPool = new Pool(Char);
const ObjectPool = new Pool(ScriptObject);

// -- Helpers

function isGTA3() {
  return ["re3", "gta3", "gta3_unreal"].includes(HOST);
}

function isVC() {
  return ["reVC", "vc", "vc_unreal"].includes(HOST);
}

function isSA() {
  return ["sa", "sa_unreal"].includes(HOST);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertVar(id: number) {
  assert(id >= 2 && id <= 16383, "Global variable is out of range. Use number between 2 and 16383 (0x3FFF)");
}

function assertCleoVersion(version: string) {
  const [major, minor, patch] = version.split(".");
  const e = `Minimum required CLEO version: ${version}`;
  if (CLEO.version.major > major) {
    return;
  }
  if (CLEO.version.major < major) {
    throw new Error(e);
  }
  if (CLEO.version.minor > minor) {
    return;
  }
  if (CLEO.version.minor < minor) {
    throw new Error(e);
  }
  if (CLEO.version.patch > patch) {
    return;
  }
  if (CLEO.version.patch < patch) {
    throw new Error(e);
  }
}

const COLORS = [
  { name: "Black", rgba: [0, 0, 0, 255] },
  { name: "White", rgba: [255, 255, 255, 255] },
  { name: "Red", rgba: [255, 0, 0, 255] },
  { name: "Lime", rgba: [0, 255, 0, 255] },
  { name: "Blue", rgba: [0, 0, 255, 255] },
  { name: "Yellow", rgba: [255, 255, 0, 255] },
  { name: "Cyan", rgba: [0, 255, 255, 255] },
  { name: "Magenta", rgba: [255, 0, 255, 255] },
  { name: "Silver", rgba: [192, 192, 192, 255] },
  { name: "Gray", rgba: [128, 128, 128, 255] },
  { name: "Maroon", rgba: [128, 0, 0, 255] },
  { name: "Olive", rgba: [128, 128, 0, 255] },
  { name: "Green", rgba: [0, 128, 0, 255] },
  { name: "Purple", rgba: [128, 0, 128, 255] },
  { name: "Teal", rgba: [0, 128, 128, 255] },
  { name: "Navy", rgba: [0, 0, 128, 255] },
  { name: "Orange", rgba: [255, 165, 0, 255] },
  { name: "Pink", rgba: [255, 192, 203, 255] },
  { name: "Brown", rgba: [165, 42, 42, 255] },
  { name: "Gold", rgba: [255, 215, 0, 255] },
  { name: "Beige", rgba: [245, 245, 220, 255] },
  { name: "Coral", rgba: [255, 127, 80, 255] },
  { name: "Crimson", rgba: [220, 20, 60, 255] },
  { name: "Indigo", rgba: [75, 0, 130, 255] },
  { name: "Ivory", rgba: [255, 255, 240, 255] },
  { name: "Khaki", rgba: [240, 230, 140, 255] },
  { name: "Lavender", rgba: [230, 230, 250, 255] },
  { name: "Mint", rgba: [189, 252, 201, 255] },
  { name: "Peach", rgba: [255, 218, 185, 255] },
  { name: "Plum", rgba: [221, 160, 221, 255] },
  { name: "Salmon", rgba: [250, 128, 114, 255] },
  { name: "SkyBlue", rgba: [135, 206, 235, 255] },
  { name: "SlateGray", rgba: [112, 128, 144, 255] },
  { name: "SteelBlue", rgba: [70, 130, 180, 255] },
  { name: "Tan", rgba: [210, 180, 140, 255] },
  { name: "Turquoise", rgba: [64, 224, 208, 255] },
  { name: "Violet", rgba: [238, 130, 238, 255] },
  { name: "Wheat", rgba: [245, 222, 179, 255] },
  { name: "Aqua", rgba: [0, 255, 255, 255] },
  { name: "Chartreuse", rgba: [127, 255, 0, 255] },
  { name: "DarkBlue", rgba: [0, 0, 139, 255] },
  { name: "DarkGreen", rgba: [0, 100, 0, 255] },
  { name: "DarkRed", rgba: [139, 0, 0, 255] },
  { name: "LightGray", rgba: [211, 211, 211, 255] },
  { name: "LightBlue", rgba: [173, 216, 230, 255] },
  { name: "DarkGray", rgba: [169, 169, 169, 255] },
  { name: "HotPink", rgba: [255, 105, 180, 255] },
  { name: "DeepSkyBlue", rgba: [0, 191, 255, 255] },
];

type RGBATuple = [number, number, number, number];
type ColorName = (typeof COLORS)[number]["name"];

class TextDraw {
  private _color: () => RGBATuple;
  private _bg: (() => RGBATuple) | undefined;
  private _opacity: ((a: number) => number) | undefined;
  private _alignment = 0;
  private _width = 640.0;
  private _scale: (() => [number, number]) | undefined;
  private _scaleX: () => number;
  private _scaleY: () => number;
  private _x: () => number;
  private _y: () => number;
  private _pos: () => [number, number];
  private _font = 1;
  private _case: "normal" | "upper" | "lower" = "normal";

  constructor() {
    this.color(255, 255, 255, 255);
    this.x(0);
    this.y(0);
    this.scale(0.48, 1.12);
  }

  color(
    r: number | ColorName | ((r: number, g: number, b: number, a: number) => RGBATuple),
    g: number = 255,
    b: number = 255,
    a: number = 255
  ) {
    if (typeof r === "function") {
      let prev: RGBATuple = [255, 255, 255, 255];
      this._color = () => {
        const alpha = typeof this._opacity === "function" ? this._opacity(prev[3]) : prev[3];
        prev = r(prev[0], prev[1], prev[2], alpha);
        return this.parseRgba(...prev);
      };
    } else {
      let prev: RGBATuple = this.parseRgba(r, g, b, a);
      this._color = () => {
        if (typeof this._opacity === "function") {
          prev[3] = this._opacity(prev[3]);
        }
        return this.parseRgba(...prev);
      };
    }
    return this;
  }

  randomColor() {
    this.color(COLORS[Math.floor(Math.random() * COLORS.length)].name);
    return this;
  }

  opacity(a: number | string | ((prev: number) => number | string)) {
    let prev = 255;
    this._opacity =
      typeof a === "function" ? () => (prev = this.parseRatio(a(prev), 255)) : () => this.parseRatio(a, 255);
    return this;
  }

  alignLeft() {
    this._alignment = 0;
    return this;
  }

  font(font: number) {
    this._font = font;
    return this;
  }

  uppercase() {
    this._case = "upper";
    return this;
  }

  lowercase() {
    this._case = "lower";
    return this;
  }

  normalCase() {
    this._case = "normal";
    return this;
  }

  alignCenter() {
    this._alignment = 1;
    return this;
  }

  alignRight() {
    this._alignment = 2;
    return this;
  }

  maxWidth(value: number | string) {
    this._width = this.parseRatio(value, 640);
    return this;
  }

  scale(x: number | ((x: number, y: number) => [number, number]), y: number) {
    let prev: [number, number] = [0, 0];
    if (typeof x === "function") {
      this._scale = () => {
        prev = x(...prev);
        return [...prev];
      };
      return this;
    }

    return this.scaleX(x).scaleY(y);
  }

  scaleX(x: number | ((prev: number) => number)) {
    let prev = 0;
    this._scaleX = typeof x === "function" ? () => (prev = x(prev)) : () => x;
    return this;
  }

  scaleY(y: number | ((prev: number) => number)) {
    let prev = 0;
    this._scaleY = typeof y === "function" ? () => (prev = y(prev)) : () => y;
    return this;
  }

  bg(
    r: number | ColorName | ((r: number, g: number, b: number, a: number) => RGBATuple),
    g: number = 255,
    b: number = 255,
    a: number = 255
  ) {
    if (typeof r === "function") {
      let prev: RGBATuple = [128, 128, 128, 128];
      this._bg = () => {
        prev = r(...prev);
        return this.parseRgba(...prev);
      };
    } else {
      this._bg = () => this.parseRgba(r, g, b, a);
    }

    return this;
  }

  noBg() {
    this._bg = undefined;
    return this;
  }

  x(x: number | string | ((x: number) => number)) {
    let prev = 0;
    this._x = typeof x === "function" ? () => (prev = this.parseRatio(x(prev), 640)) : () => this.parseRatio(x, 640);
    return this;
  }

  y(y: number | string | ((y: number) => number)) {
    let prev = 0;
    this._y = typeof y === "function" ? () => (prev = this.parseRatio(y(prev), 448)) : () => this.parseRatio(y, 448);
    return this;
  }

  pos(x: number | string | ((x: number, y: number) => [number, number]), y: number | string) {
    let prev: [number, number] = [0, 0];
    if (typeof x === "function") {
      this._pos = () => {
        prev = x(...prev);
        return [this.parseRatio(prev[0], 640), this.parseRatio(prev[1], 448)];
      };
      return this;
    }

    return this.x(x).y(y);
  }

  draw(text: string) {
    const addr = this.getInternalTextDraw();

    if (this._bg) {
      const [bgR, bgG, bgB, bgA] = this._bg();
      Memory.WriteU32(addr + 0x18, bgR | (bgG << 8) | (bgB << 16) | (bgA << 24), false);
      Memory.WriteU8(addr + 0x0e, 1);
    } else {
      Memory.WriteU8(addr + 0x0e, 0);
    }

    const [r, g, b, a] = this._color();

    Text.SetColor(r, g, b, a);
    Text.SetFont(this._font);

    switch (this._alignment) {
      case 0:
        // default
        break;
      case 1:
        Text.SetCenter(true);
        break;
      case 2:
        Text.SetRightJustify(true);
        break;
    }

    Text.SetWrapX(this._width);
    Text.SetCenterSize(this._width);
    if (HOST === "sa") {
      Text.SetDropshadow(1, 0, 0, 0, 255);
    }

    const [scaleX, scaleY] = this._scale ? this._scale() : [this._scaleX(), this._scaleY()];
    Text.SetScale(scaleX, scaleY);
    const transformedText = (
      this._case === "upper" ? text.toUpperCase() : this._case === "lower" ? text.toLowerCase() : text
    ).trimEnd();

    const [x, y] = this._pos ? this._pos() : [this._x(), this._y()];
    switch (HOST) {
      case "re3":
      case "gta3":
      case "reVC":
      case "vc": {
        Memory.WriteFloat(addr + 0x24, x, false);
        Memory.WriteFloat(addr + 0x28, y, false);
        Memory.WriteUtf16(addr + 0x2c, transformedText);
        break;
      }

      case "sa": {
        Text.DisplayFormatted(x, y, transformedText);
        break;
      }
    }

    Text.UseCommands(false);
  }

  private parseRatio(value: number | string, total: number): number {
    if (typeof value === "string") {
      if (value.endsWith("%")) {
        const percent = parseFloat(value.slice(0, -1));
        return (total * percent) / 100;
      }
      return parseFloat(value);
    }
    return value;
  }

  private parseRgba(r: number | string, g: number = 255, b: number = 255, a: number = 255): RGBATuple {
    if (typeof r === "string") {
      if (r.startsWith("#")) {
        const hex = r.replace("#", "");
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) : 255;
      } else {
        // prettier-ignore
        for (const color of COLORS) {
          if (color.name.toLowerCase() === r.toLowerCase()) {
            return [color.rgba[0], color.rgba[1], color.rgba[2], color.rgba[3]];
          }
        }
        throw new Error(`Unknown color name: ${r}`);
      }
    }
    return [r, g, b, a];
  }

  private getInternalTextDraw() {
    const map = {
      re3: [
        Memory.Translate("CTheScripts::IntroTextLines"),
        Memory.Translate("CTheScripts::NumberOfIntroTextLinesThisFrame"),
        0x414,
        2,
      ],
      reVC: [
        Memory.Translate("CTheScripts::IntroTextLines"),
        Memory.Translate("CTheScripts::NumberOfIntroTextLinesThisFrame"),
        0xf4,
        48,
      ],
      gta3: [0x70ea68, 0x95cc88, 0x414, 2],
      vc: [0x7f0ea0, 0xa10a48, 0xf4, 48],
      sa: [0x00a913e8, 0x00a44b68, 0x44, 96],
    };
    const [baseAddr, indexAddr, structSize, maxLines] = map[HOST];

    let index = Memory.ReadI32(indexAddr, false);
    if (index >= maxLines) {
      index = maxLines - 1;
    }

    return baseAddr + index * structSize;
  }
}

export { SCM, Counter, Timer, VehiclePool, PedPool, ObjectPool, TextDraw };
