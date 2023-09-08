import axios from "axios";

export async function fetchTransaction(txid: string): Promise<any> {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://stacks-node-api.testnet.stacks.co/extended/v1/tx/${txid}`)
      .then((res) => {
        resolve(res ? res.data: '');
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export const wait = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
};
