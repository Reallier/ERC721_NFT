/**
 * ERC721作为一种非同质化代币（NFT）标准，在数字经济中扮演着重要角色。
 * 它允许创建独一无二的数字资产，每个代币都具有不可替代的属性和价值。
 * 这使得ERC721成为数字艺术品、收藏品、游戏内物品和其他虚拟商品的理想选择。
 * 通过为每个代币分配一个唯一的标识符（tokenId），ERC721确保了其独特性和所有权的透明性。
 * 此外，ERC721的标准化接口促进了不同应用之间的互操作性，使得数字资产可以跨平台交易和使用。
 * 随着区块链技术的不断发展，ERC721代币的潜在应用场景预计将进一步扩大，从而增加其价值和重要性。
 * /

/**
 * 测试环境
 * 开发工具: Hardhat
 * 测试框架: Mocha
 * 断言库: Chai
 * 编程语言: JavaScript / Solidity
 */

/** 
 * 初始化:
 * 函数: init
 * 描述: 部署 BaseERC721 和 BaseERC721Receiver 合约，并获取它们的地址。
 * 钩子: beforeEach
 * 描述: 在每个测试用例执行前调用 init 函数，确保每次测试都在干净的环境中进行。
 */

/** 
 * 测试用例: 
 * 
 * IERC721Metadata接口
 * - 验证合约的name函数返回值是否与预期的name常量相等
 * - 验证合约的symbol函数返回值是否与预期的symbol常量相等
 * - tokenURI函数
 * - - 验证当查询不存在的代币ID的URI时，合约应该抛出一个带有特定错误消息的异常
 * - - 验证当tokenId存在时，tokenURI函数应该返回预期的baseURI
 * 
 * IERC721 接口
 * - balanceOf 函数
 * - - 检查 balanceOf 函数在 mint 之前是否返回 0
 * - ownerOf 函数
 * - - 检查 ownerOf 函数在 mint 之后是否返回正确的持有者地址
 * - approve 授权函数
 * - - 合约的所有者检查能否成功批准代币
 * - - 已获批准的账户是否能够成功批准代币
 * - - 将代币批准给当前所有者是否会回滚并抛出错误
 * - - 非所有者和非批准账户的代币批准是否会回滚并抛出错误
 * - getApproved 查询批准函数
 * - - 函数返回的地址与批准的地址一致
 * - - 查询不存在的代币的批准信息应该失败
 * - setApprovalForAll 批量授权函数
 * - - 函数能否正确设置批准状态为 true 或 false
 * - - 函数在尝试批准给所有者自己时是否会失败
 * - transferFrom 转账函数, 主要看账户及授权相关
 * - - 所有者账户的转账是否成功，并且余额是否发生变化
 * - - 经过授权的账户的转账是否成功，并且余额是否发生变化
 * - - 经过批量授权的账户的转账是否成功，并且余额是否发生变化
 * - - 非所有者且未被授权的账户尝试转账时是否会回滚，并抛出特定的错误信息
 * - - 转账不存在的代币时是否会回滚，并抛出特定的错误信息
 * - - 转账到零地址时是否会回滚，并抛出特定的错误信息
 * - - 从非所有者账户转账时是否会回滚，并抛出特定的错误信息
 * - - 当代币被转移时，旧的批准是否会被撤销
 * - safeTransferFrom安全转账函数测试, 和transferFrom大致一致, 多了检查地址是否支持ERC721标准
 * - - 所有者应该成功转移代币并且余额应该改变
 * - - 被批准的账户应该成功转移代币并且余额应该改变
 * - - 非所有者且未被批准的账户应该转移失败并回滚
 * - - 转移到不支持 ERC721Receiver 的合约应该回滚
 * - - 转移到支持 ERC721Receiver 的合约应该成功
 * 
 * mint铸币函数测试
 * - 成功应该更新余额
 * - 到零地址应该回滚
 * - 重复的 tokenId 应该回滚
*/
 

// 引入 Chai 断言库，用于编写更清晰的测试用例
const { expect } = require('chai');
//  引入 Hardhat 运行环境中的 ethers 模块，用于与智能合约进行交互
const { ethers } = require('hardhat');

/**
 * 测试套件用于测试 BaseERC721 智能合约
 * 该套件将初始化合约，并测试其基本功能，如部署、Mint和 Transfer
 */
describe("BaseERC721", async () => {
    // 声明合约和合约地址变量
    let contract, contractAddr;
    // 声明接收者合约和合约地址变量
    let receivercontract, receivercontractAddr;
    // 声明账户变量和所有者变量
    let accounts, owner;
    // 定义合约名称
    const name = 'BaseERC721';
    // 定义合约符号
    const symbol = 'BERC721';
    // 定义合约的 baseURI
    const baseURI = 'https://images.example.com/';

    // 创建一个随机的以太坊账户
    const randomAccount = ethers.Wallet.createRandom();
    // 获取随机账户的地址
    const randomAddr = randomAccount.address;
    // 定义以太坊的零地址常量
    const ZeroAddress = ethers.constants.AddressZero;

    /**
     * 初始化函数，部署合约并返回合约地址。
     *
     * 该函数会部署一个名为 BaseERC721 的 ERC721 代币合约和一个名为 BaseERC721Receiver 的合约。
     * 部署完成后，返回两个合约的地址。
     *
     * @returns {Promise} 一个包含两个合约地址的 Promise 对象。
     */
    async function init() {
        // 部署 BaseERC721, 获取测试网络上的所有账户
        accounts = await ethers.getSigners();
        // 获取第一个账户作为部署合约的账户
        owner = accounts[0];

        {
            const factory = await ethers.getContractFactory('BaseERC721');
            // 使用工厂合约部署新的 BaseERC721 合约，并传递必要的参数
            contract = await factory.deploy(...[name, symbol, baseURI]);
            // 等待合约部署完成
            await contract.deployed();
        }

        {
            const factory = await ethers.getContractFactory('BaseERC721Receiver');
            // 使用工厂合约部署新的 BaseERC721 合约，并传递必要的参数
            receivercontract = await factory.deploy();
            // 等待合约部署完成
            await receivercontract.deployed();
        }

        // 获取部署的 BaseERC721 合约的地址
        contractAddr = contract.address;
        // 获取部署的 BaseERC721Receiver 合约的地址
        receivercontractAddr = receivercontract.address;
    }

    // 定义一个 beforeEach 勾子函数，它将在每个测试用例执行之前运行
    beforeEach(async () => {
        // 调用 init 函数，初始化合约, 部署完成后，返回两个合约的地址。
        await init();
    })

    // 验证IERC721Metadata接口的行为
    describe("IERC721Metadata", async () => {
        // 验证合约的name函数返回值是否与预期的name常量相等
        it("name", async () => {
            expect(await contract.name()).to.equal(name);
        });

        // 验证合约的symbol函数返回值是否与预期的symbol常量相等
        it("symbol", async () => {
            expect(await contract.symbol()).to.equal(symbol);
        });

        // tokenURI函数的行为
        describe("tokenURI", async () => {
            // 验证当查询不存在的代币ID的URI时，合约应该抛出一个带有特定错误消息的异常
            it("URI query for nonexistent token should revert", async () => {
                const NONE_EXISTENT_TOKEN_ID = 1234
                await expect(
                    contract.tokenURI(NONE_EXISTENT_TOKEN_ID)
                ).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
            });

            // 验证当tokenId存在时，tokenURI函数应该返回预期的baseURI
            it('Should return baseURI when tokenId exists', async function () {
                const tokenId = 1
                await contract.connect(owner).mint(randomAddr, tokenId);

                // const expectURI = baseURI + String(tokenId);
                const expectURI = baseURI;
                expect(await contract.tokenURI(tokenId)).to.equal(expectURI);
            });
        })
    })

    // 验证 IERC721 接口的行为
    describe("IERC721", async () => {
        // 验证 balanceOf 函数的行为
        describe("balanceOf ", async () => {
            // 检查 balanceOf 函数在 mint 之前是否返回 0
            it("balanceOf", async () => {
                // 检查随机地址在 mint 之前的余额是否为 0
                const beforeBalance = await contract.balanceOf(randomAddr);
                expect(beforeBalance).to.equal(0);

                // 调用 mint 函数，将 tokenId 1 铸造给 randomAddr
                await contract.connect(owner).mint(randomAddr, 1);

                // 检查随机地址在 mint 之后的余额是否为 1
                const afterBalance = await contract.balanceOf(randomAddr);
                expect(afterBalance).to.equal(1);
            });
        });

        // 验证 ownerOf 函数
        describe("ownerOf ", async () => {
            // 检查 ownerOf 函数在 mint 之后是否返回正确的持有者地址
            it("ownerOf", async () => {
                const tokenId = 1;
                const receiver = randomAddr;
                
                // 检查mint之前，tokenId的持有者是否为零地址
                const beforeBalance = await contract.ownerOf(tokenId);
                expect(beforeBalance).to.equal(ZeroAddress);

                // 调用mint函数，将tokenId 1铸造给接收者地址
                await contract.connect(owner).mint(receiver, 1);

                // 检查mint之后，tokenId的持有者是否为接收者地址
                const holder = await contract.ownerOf(tokenId);
                expect(holder).to.equal(receiver);
            });
        });

        // 测试 approve 授权函数
        describe('approve', function () {
            // 测试合约的所有者是否能够成功地批准（approve）一个特定的代币（token）给另一个地址
            it('owner should approve successfully', async function () {
                // mint token first, 铸造一个代币ID为1的代币给合约的所有者地址
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); //mint to self

                // 定义一个接收地址 to，用于接收代币的批准
                const to = randomAddr;
                // 期望调用 approve 函数时，会触发合约的 Approval 事件，并且事件参数与预期一致
                await expect(
                    contract.connect(owner).approve(to, tokenId)
                ).to.emit(contract, "Approval")
                    // 验证事件的参数是否与预期一致
                    .withArgs(owner.address, to, tokenId);

                // 获取批准的地址
                expect(await contract.getApproved(tokenId)).to.equal(to);
            });

            // 测试已获批准的账户是否能够成功批准代币
            it('approved account should approve successfully', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); //mint to self

                // setApprovalForAll accounts1, 设置accounts1的setApprovalForAll权限
                const caller = accounts[1];
                // 所有者授权accounts1地址可以管理所有代币
                await contract.connect(owner).setApprovalForAll(caller.address, true)

                // accounts1 approve owner's tokenId[1] to randomAddr
                const to = randomAddr;
                expect(
                    // 调用合约的approve函数，将代币ID为1的代币批准给to地址
                    await contract.connect(caller).approve(to, tokenId)
                ).to.be.ok;

                // 获取批准的地址
                expect(await contract.getApproved(tokenId)).to.equal(to);
            });

            // 验证将代币批准给当前所有者是否会回滚并抛出错误
            it('Approve to current owner should revert', async function () {
                // mint token first
                const tokenId = 1;
                const receiver = owner.address; //self
                await contract.connect(owner).mint(receiver, tokenId);

                await expect(
                    // 尝试将代币批准给当前所有者
                    contract.connect(owner).approve(receiver, tokenId)
                ).to.be.revertedWith("ERC721: approval to current owner");
            });

            // 验证非所有者和非批准账户的代币批准是否会回滚并抛出错误
            it('Not owner nor approved token approveal should revert', async function () {
                // mint token first
                const tokenId = 1;
                const receiver = owner.address; //self
                await contract.connect(owner).mint(receiver, tokenId);

                const otherAccount = accounts[1]; //not owner or approved
                await expect(
                    contract.connect(otherAccount).approve(randomAddr, tokenId)
                ).to.be.revertedWith("ERC721: approve caller is not owner nor approved for all");
            });
        });

        // 定义一个测试套件，用于测试 getApproved 查询批准函数的行为
        describe('getApproved', function () {
            // 测试用例：应该返回批准地址
            it('should return approval address', async function () {
                // mint token first
                const tokenId = 1;
                const receiver = owner.address; //self
                await contract.connect(owner).mint(receiver, tokenId);

                // 然后批准一个地址
                const approvedAddr = randomAddr;
                await contract.connect(owner).approve(randomAddr, tokenId);

                // 断言 getApproved 函数返回的地址与批准的地址一致
                expect(await contract.getApproved(tokenId)).to.equal(approvedAddr);
            });

            // 测试用例：查询不存在的代币的批准信息应该失败
            it('Approved query for nonexistent token should revert', async function () {
                const tokenId = 1; // not exists

                await expect(
                    // 断言调用 getApproved 函数会抛出特定的错误信息
                    contract.getApproved(tokenId)
                ).to.be.revertedWith('ERC721: approved query for nonexistent token');
            });
        });

        /**
         * 测试 ERC721 NFT 合约中的 setApprovalForAll 函数
         * 这个测试套件检查 setApprovalForAll 函数是否按预期工作
         * 包括设置和清除对所有代币的批准，以及尝试批准给自己时是否会失败
         */
        describe('setApprovalForAll', function () {
            /**
             * 测试 setApprovalForAll 函数能否正确设置批准状态为 true 或 false
             * 这个测试用例首先铸造一个代币，然后设置批准状态为 true 和 false
             * 并验证 isApprovedForAll 函数返回的结果是否正确
             */
            it('setApprovalForAll true/flase', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const spender = randomAddr;

                // 设置批准状态为 true
                await contract.connect(owner).setApprovalForAll(spender, true);
                // 验证 isApprovedForAll 函数返回 true
                expect(await contract.isApprovedForAll(owner.address, spender)).to.equal(true);

                // 设置批准状态为 false
                await contract.connect(owner).setApprovalForAll(spender, false);
                // 验证 isApprovedForAll 函数返回 false
                expect(await contract.isApprovedForAll(owner.address, spender)).to.equal(false);
            });

            /**
             * 测试 setApprovalForAll 函数在尝试批准给所有者自己时是否会失败
             * 这个测试用例首先铸造一个代币，然后尝试批准给所有者自己
             * 并验证交易是否会回滚，同时抛出特定的错误信息
             */
            it('Approve to self should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                await expect(
                    // 尝试批准给所有者自己，预期会失败并回滚交易
                    contract.connect(owner).setApprovalForAll(owner.address, true) // approve to self
                ).to.be.revertedWith("ERC721: approve to caller");
            });
        });

        // 描述：测试 transferFrom 转账函数, 主要看账户及授权相关
        describe('transferFrom', function () {
            // 检查所有者账户的转账是否成功，并且余额是否发生变化
            it('owner account should succeed and balance should change', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                // 定义一个随机地址，作为接收代币的目标地址
                const to = randomAddr;

                // balance change
                await expect(
                    // 连接到合约的 owner 账户，调用 transferFrom 函数
                    contract.connect(owner).transferFrom(owner.address, to, tokenId)
                ).to.changeTokenBalances(contract, [owner.address, to], [-1, 1]);
            });

            // 检查经过授权的账户的转账是否成功，并且余额是否发生变化
            it('approved account should succeed and balance should change', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // approve, 进行授权操作
                const spenderAccout = accounts[1];
                // 所有者调用合约的 approve 函数，授权 spenderAccout 地址可以转移 tokenId 代币
                await contract.connect(owner).approve(spenderAccout.address, tokenId)

                // transfer and balance should change
                await expect(
                    // 连接到合约的 spenderAccout 账户，调用 transferFrom 函数
                    contract.connect(spenderAccout).transferFrom(owner.address, to, tokenId)
                ).to.changeTokenBalances(contract, [owner.address, to], [-1, 1]);
            });

            // 检查经过批量授权的账户的转账是否成功，并且余额是否发生变化
            it('approvedForAll account should succeed and balance should change', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // setApprovalForAll
                const spenderAccout = accounts[1];
                // 所有者调用合约的 setApprovalForAll 函数，授权 spenderAccout 地址可以转移所有代币
                await contract.connect(owner).setApprovalForAll(spenderAccout.address, true)

                // 期望调用 transferFrom 函数后，合约的余额会发生变化 
                await expect(
                    // 连接到合约的 spenderAccout 账户，调用 transferFrom 函数
                    contract.connect(spenderAccout).transferFrom(owner.address, to, tokenId)
                ).to.changeTokenBalances(contract, [owner.address, to], [-1, 1]);
            });

            // 检查非所有者且未被授权的账户尝试转账时是否会回滚，并抛出特定的错误信息
            it('not owner nor approved should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr; // 随机地址
                const otherAccount = accounts[1]; //not owner or approved

                // 期望调用 transferFrom 函数后，交易会回滚并抛出 "ERC721: transfer caller is not owner nor approved" 的错误信息
                await expect(
                    // 连接到合约的 otherAccount 账户，调用 transferFrom 函数
                    contract.connect(otherAccount).transferFrom(owner.address, to, tokenId)
                ).to.revertedWith("ERC721: transfer caller is not owner nor approved");
            });

            // 检查尝试转账不存在的代币时是否会回滚，并抛出特定的错误信息
            it('none exists tokenId should revert', async function () {
                // 生成一个不存在的代币 ID
                const NONE_EXISTENT_TOKEN_ID = Math.ceil(Math.random() * 1000000);
                const to = randomAddr;
                 // 期望调用 transferFrom 函数后，交易会回滚并抛出 "ERC721: operator query for nonexistent token" 的错误信息
                await expect(
                    contract.connect(owner).transferFrom(owner.address, to, NONE_EXISTENT_TOKEN_ID)
                ).to.revertedWith("ERC721: operator query for nonexistent token");
            });

            // 测试用例：检查尝试转账到零地址时是否会回滚，并抛出特定的错误信息
            it('to zero address should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = ZeroAddress;
                await expect(
                    contract.connect(owner).transferFrom(owner.address, to, tokenId)
                ).to.revertedWith("ERC721: transfer to the zero address");
            });

            // 测试用例：检查尝试从非所有者账户转账时是否会回滚，并抛出特定的错误信息
            it('from != caller.address should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;
                const from = accounts[1].address;
                await expect(
                    contract.connect(owner).transferFrom(from, to, tokenId)
                ).to.revertedWith("ERC721: transfer from incorrect owner");
            });

            // 测试用例：检查当代币被转移时，旧的批准是否会被撤销
            it('should revoke old approval when token transfered', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // approve
                const spender = accounts[1].address;
                // 连接到合约的 owner 账户，调用 approve 函数，批准 spender 账户花费 tokenId 代币
                await contract.connect(owner).approve(spender, tokenId);
                // 检查批准是否成功，期望 getApproved 函数返回的地址等于 spender 地址
                expect(await contract.getApproved(tokenId)).to.equal(spender); //before

                // 连接到合约的 owner 账户，调用 transferFrom 函数，将代币从 owner 地址转移到 to 地址
                await contract.connect(owner).transferFrom(owner.address, to, tokenId);

                // 检查批准是否被撤销，期望 getApproved 函数返回的地址等于零地址
                expect(await contract.getApproved(tokenId)).to.equal(ZeroAddress); // after
            });
        });

        // 描述：测试 safeTransferFrom 安全转账函数的行为, 和transferFrom大致一致, 多了检查地址是否支持ERC721标准
        describe('safeTransferFrom', function () {
            // same as transferFrom, 测试用例：所有者应该成功转移代币并且余额应该改变
            it('owner should succeed and balance should change', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // balance change
                await expect(
                    contract.connect(owner)["safeTransferFrom(address,address,uint256)"](owner.address, to, tokenId)
                ).to.changeTokenBalances(contract, [owner.address, to], [-1, 1]);
            });

            // same as transferFrom, 测试用例：被批准的账户应该成功转移代币并且余额应该改变
            it('approved should succeed and balance should change', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // approve
                const spenderAccout = accounts[1];
                await contract.connect(owner).approve(spenderAccout.address, tokenId)

                // transfer and balance should change
                await expect(
                    contract.connect(spenderAccout)["safeTransferFrom(address,address,uint256)"](owner.address, to, tokenId)
                ).to.changeTokenBalances(contract, [owner.address, to], [-1, 1]);
            });

            // same as transferFrom, 测试用例：非所有者且未被批准的账户应该转移失败并回滚
            it('not owner nor approved should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;
                const otherAccount = accounts[1]; //not owner or approved
                await expect(
                    contract.connect(otherAccount)["safeTransferFrom(address,address,uint256)"](owner.address, to, tokenId)
                ).to.revertedWith("ERC721: transfer caller is not owner nor approved");
            });

            // 测试用例：转移到不支持 ERC721Receiver 的合约应该回滚
            it('transfer to none ERC721Receiver implementer should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = contractAddr; // not support ERC721Receiver
                await expect(
                    contract.connect(owner)["safeTransferFrom(address,address,uint256)"](owner.address, to, tokenId)
                ).to.revertedWith("ERC721: transfer to non ERC721Receiver implementer");
            });

            // 测试用例：转移到支持 ERC721Receiver 的合约应该成功
            it('transfer to ERC721Receiver implementer should succeed', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = receivercontractAddr; // support ERC721Receiver
                expect(
                    await contract.connect(owner)["safeTransferFrom(address,address,uint256)"](owner.address, to, tokenId)
                ).to.be.ok;
            });
        });
    })

    // 铸币函数测试
    describe("mint", async () => {
        // 测试用例：mint 成功应该更新余额
        it('mint succeed should update balance', async function () {
            const tokenId = 1;

            // 期望调用 mint 函数后，交易会改变代币余额
            await expect(
                contract.connect(owner).mint(randomAddr, tokenId)
            ).to.changeTokenBalance(contract, randomAddr, 1);
        });

        // 测试用例：mint 到零地址应该回滚
        it("mint to the zero address should revert", async () => {
            const tokenId = 1;

            await expect(
                contract.connect(owner).mint(ZeroAddress, tokenId)
            ).to.be.revertedWith("ERC721: mint to the zero address");
        });

        // 测试用例：mint 重复的 tokenId 应该回滚
        it("mint repeated tokenId should revert", async () => {
            const tokenId = 1;

            // first mint
            await contract.connect(owner).mint(randomAddr, tokenId)

            // sencond
            await expect(
                contract.connect(owner).mint(randomAddr, tokenId)
            ).to.be.revertedWith("ERC721: token already minted");
        });
    })
});