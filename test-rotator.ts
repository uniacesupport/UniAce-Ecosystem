import { NvidiaProvider } from "./server/providers";
const provider = new NvidiaProvider("dummy");
async function test() {
  const key = await (provider as any).rotator.getNextKey();
  console.log("key is", key);
}
test();
