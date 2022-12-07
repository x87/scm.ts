/// <reference path="../.config/sa.d.ts" />

// SCM.js v0.1.0

assertCleoVersion("1.0.5");
assert(isGTA3() || isVC() || isSA(), "Unsupported game");

// -- SCM

const mainScm = Memory.Translate("CTheScripts::ScriptSpace");
assert(mainScm, "Main.scm address not found");

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
  readVar(id) {
    assertVar(id);
    return Memory.ReadI32(mainScm + id * 4, false, false);
  },

  writeVar(id, value) {
    assertVar(id);
    return Memory.WriteI32(mainScm + id * 4, value, false, false);
  },
};

// -- Counters & Timers --

class DisplayedCounter {
  #_id;
  #_customKey;
  constructor(id, initialValue, customKey) {
    this.#_id = id;
    this.#_customKey = customKey;
    this.value = initialValue;
  }
  get value() {
    return SCM.readVar(this.#_id);
  }
  set value(value) {
    SCM.writeVar(this.#_id, value);
  }
  clear() {
    if (this.#_customKey) {
      FxtStore.delete(this.#_customKey, true);
    }
    Hud.ClearCounter(this.#_id);
  }
}

class DisplayedTimer {
  #_id;
  #_customKey;
  constructor(id, initialValue, customKey) {
    this.#_id = id;
    this.#_customKey = customKey;
    this.value = initialValue;
  }
  get value() {
    return SCM.readVar(this.#_id);
  }
  set value(value) {
    SCM.writeVar(this.#_id, value);
  }
  clear() {
    if (this.#_customKey) {
      FxtStore.delete(this.#_customKey, true);
    }
    Hud.ClearTimer(this.#_id);
  }
  freeze(state) {
    Hud.FreezeTimer(state);
  }
}

class Counter {
  /** @type number 0-number,1-bar */ #_type = 0;
  /** @type number 1,2,3,4 slot */ #_slot = 1;
  /** @type string custom label */ #_text = "";
  /** @type string gxt key */ #_key;
  /** @type boolean no flash on first appear */ #_noFlash;
  /** @type number initial value */ #_initialValue = 0;

  constructor(props = 0) {
    if (typeof props === "object") {
      const { type, slot, text, key, noFlash, initialValue = 0 } = props;
      type && this.type(type);
      slot && this.slot(slot);
      text && this.text(text);
      key && this.key(key);
      noFlash && this.noFlash();
      this.#_initialValue = initialValue;
    } else {
      this.#_initialValue = props;
    }
  }
  type(type) {
    this.#_type = type;
    return this;
  }
  slot(value) {
    let slot = Number(value);
    if (slot < 1 || isGTA3()) {
      slot = 1;
    } else if (slot > 4) {
      slot = 4;
    }
    this.#_slot = slot;
    return this;
  }
  text(text) {
    this.#_text = text ?? "";
    return this;
  }
  key(key) {
    this.#_key = key;
    return this;
  }
  noFlash() {
    this.#_noFlash = true;
    return this;
  }

  display() {
    let customKey = "";
    if (!this.#_key) {
      customKey = `__cnts${this.#_slot}`;
      this.key(customKey);
      FxtStore.insert(this.#_key, this.#_text, true);
    }

    const id = counters + this.#_slot;

    if (isGTA3()) {
      Hud.DisplayCounterWithString(id, this.#_type, this.#_key);
    } else {
      Hud.DisplayNthCounterWithString(id, this.#_type, this.#_slot, this.#_key);
    }

    if (isSA() && this.#_noFlash) {
      Hud.SetCounterFlashWhenFirstDisplayed(id, false);
    }

    return new DisplayedCounter(id, this.#_initialValue, customKey);
  }
}

class Timer {
  /** @type number 0-Up,1-Down */ #_direction = 1;
  /** @type number 1,2,3,4 slot */ #_slot = 0;
  /** @type number time when beeps */ #_beepTime;
  /** @type string custom label */ #_text = "";
  /** @type string gxt key */ #_key;
  /** @type number initial value */ #_initialValue = 0;

  constructor(props = 0) {
    if (typeof props === "object") {
      const { direction, beepTime, text, key, initialValue = 0 } = props;
      this.direction(direction ?? 1);
      beepTime && this.beepTime(beepTime);
      text && this.text(text);
      key && this.key(key);
      this.#_initialValue = initialValue;
    } else {
      this.#_initialValue = props;
    }
  }
  direction(direction) {
    this.#_direction = direction;
    return this;
  }
  beepTime(value) {
    if (!isSA()) {
      return this;
    }
    let beepTime = Number(value);
    this.#_beepTime = beepTime < 0 ? 0 : beepTime;
    return this;
  }
  text(text) {
    this.#_text = text ?? "";
    return this;
  }
  key(key) {
    this.#_key = key;
    return this;
  }

  display() {
    const slot = 0;
    const id = counters + slot;
    let customKey = "";

    if (!this.#_key) {
      customKey = `__cnts${slot}`;
      this.key(customKey);
      FxtStore.insert(this.#_key, this.#_text, true);
    }

    if (isGTA3()) {
      Hud.DisplayTimerWithString(id, this.#_key);
    } else {
      Hud.DisplayTimerWithString(id, this.#_direction, this.#_key);
    }
    if (isSA() && this.#_beepTime) {
      Hud.SetTimerBeepCountdownTime(id, this.#_beepTime);
    }

    return new DisplayedTimer(id, this.#_initialValue, customKey);
  }
}

export { SCM, Counter, Timer };

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertVar(id) {
  assert(id >= 2 && id <= 16383, "Global variable is out of range. Use number between 2 and 16383 (0x3FFF)");
}

function assertCleoVersion(version) {
  const [major, minor, patch] = version.split(".");
  const e = `Minimum required CLEO version: ${version}`;
  assert(CLEO.version.major >= major, e);
  assert(CLEO.version.minor >= minor, e);
  assert(CLEO.version.patch >= patch, e);
}
