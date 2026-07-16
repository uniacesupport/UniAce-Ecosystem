class DynamicKeyRotator {
  constructor() {
    this.fallbackKeys = ['MY_ONLY_KEY'];
    this.dbKeys = [];
    this.currentIndex = 0;
    this.exhaustedKeys = new Set();
  }

  async getNextKey() {
    const allKeys = [...this.fallbackKeys, ...this.dbKeys];
    const activeKeys = allKeys;
    
    let key = activeKeys[this.currentIndex % activeKeys.length];
    let attempts = 0;
    while (this.exhaustedKeys.has(key) && attempts < activeKeys.length) {
      this.currentIndex = (this.currentIndex + 1) % activeKeys.length;
      key = activeKeys[this.currentIndex % activeKeys.length];
      attempts++;
    }

    if (attempts >= activeKeys.length) {
      console.log("All keys exhausted! Resetting...");
      this.exhaustedKeys.clear();
      key = activeKeys[this.currentIndex % activeKeys.length];
    }

    this.currentIndex = (this.currentIndex + 1) % activeKeys.length;
    return key;
  }
  
  markKeyExhausted(key) {
    this.exhaustedKeys.add(key);
  }
}

async function run() {
  const rotator = new DynamicKeyRotator();
  const k1 = await rotator.getNextKey();
  console.log("Key 1:", k1);
  rotator.markKeyExhausted(k1);
  const k2 = await rotator.getNextKey();
  console.log("Key 2:", k2);
}
run();
