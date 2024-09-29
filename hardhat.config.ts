import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
const config: HardhatUserConfig = {
  solidity: "0.8.27",
  // networks: {
  //   hardhat: {},
  //   localhost: {
  //     url: "http://127.0.0.1:8545",
  //   },
  // },
  // mocha: {
  //   timeout: 20000, // 设置超时时间
  // },
};

export default config;
