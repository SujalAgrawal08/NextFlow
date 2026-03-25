export async function executeTextNode(inputs: any, config: any) {
  return { text: config.text || "" };
}
