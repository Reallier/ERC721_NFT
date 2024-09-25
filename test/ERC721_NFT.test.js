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

    // 定义一个 beforeEach 函数，它将在每个测试用例执行之前运行
    beforeEach(async () => {
        // 调用 init 函数，初始化合约, 部署完成后，返回两个合约的地址。
        await init();
    })

    // 描述一个测试套件，用于验证IERC721Metadata接口的行为
    describe("IERC721Metadata", async () => {
        // 测试用例，验证合约的name函数返回值是否与预期的name常量相等
        it("name", async () => {
            expect(await contract.name()).to.equal(name);
        });

        // 测试用例，验证合约的symbol函数返回值是否与预期的symbol常量相等
        it("symbol", async () => {
            expect(await contract.symbol()).to.equal(symbol);
        });

        // 嵌套的描述，用于测试tokenURI函数的行为
        describe("tokenURI", async () => {
            // 测试用例，验证当查询不存在的代币ID的URI时，合约应该抛出一个带有特定错误消息的异常
            it("URI query for nonexistent token should revert", async () => {
                const NONE_EXISTENT_TOKEN_ID = 1234
                await expect(
                    contract.tokenURI(NONE_EXISTENT_TOKEN_ID)
                ).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
            });

            // 测试用例，验证当tokenId存在时，tokenURI函数应该返回预期的baseURI
            it('Should return baseURI when tokenId exists', async function () {
                const tokenId = 1
                await contract.connect(owner).mint(randomAddr, tokenId);

                // const expectURI = baseURI + String(tokenId);
                const expectURI = baseURI;
                expect(await contract.tokenURI(tokenId)).to.equal(expectURI);
            });
        })
    })

    // 测试套件，用于验证 IERC721 接口的行为
    describe("IERC721", async () => {
        // 嵌套的测试套件，用于验证 balanceOf 函数的行为
        describe("balanceOf ", async () => {
            // 测试用例，用于检查 balanceOf 函数在 mint 之前是否返回 0
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

        // 嵌套的测试套件，用于验证 ownerOf 函数的行为
        describe("ownerOf ", async () => {
            // 测试用例，用于检查 ownerOf 函数在 mint 之后是否返回正确的持有者地址
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

        // 定义一个测试套件，用于测试 approve 函数的行为
        describe('approve', function () {
            // 在 approve 测试套件中定义一个测试用例，测试合约的所有者是否能够成功地批准（approve）一个特定的代币（token）给另一个地址
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

        // 定义一个测试套件，用于测试 getApproved 函数的行为
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

        describe('transferFrom', function () {
            it('owner account should succeed and balance should change', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // balance change
                await expect(
                    contract.connect(owner).transferFrom(owner.address, to, tokenId)
                ).to.changeTokenBalances(contract, [owner.address, to], [-1, 1]);
            });

            it('approved account should succeed and balance should change', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // approve
                const spenderAccout = accounts[1];
                await contract.connect(owner).approve(spenderAccout.address, tokenId)

                // transfer and balance should change
                await expect(
                    contract.connect(spenderAccout).transferFrom(owner.address, to, tokenId)
                ).to.changeTokenBalances(contract, [owner.address, to], [-1, 1]);
            });

            it('approvedForAll account should succeed and balance should change', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // setApprovalForAll
                const spenderAccout = accounts[1];
                await contract.connect(owner).setApprovalForAll(spenderAccout.address, true)

                // transfer and balance should change
                await expect(
                    contract.connect(spenderAccout).transferFrom(owner.address, to, tokenId)
                ).to.changeTokenBalances(contract, [owner.address, to], [-1, 1]);
            });

            it('not owner nor approved should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;
                const otherAccount = accounts[1]; //not owner or approved
                await expect(
                    contract.connect(otherAccount).transferFrom(owner.address, to, tokenId)
                ).to.revertedWith("ERC721: transfer caller is not owner nor approved");
            });

            it('none exists tokenId should revert', async function () {
                const NONE_EXISTENT_TOKEN_ID = Math.ceil(Math.random() * 1000000);
                const to = randomAddr;
                await expect(
                    contract.connect(owner).transferFrom(owner.address, to, NONE_EXISTENT_TOKEN_ID)
                ).to.revertedWith("ERC721: operator query for nonexistent token");
            });

            it('to zero address should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = ZeroAddress;
                await expect(
                    contract.connect(owner).transferFrom(owner.address, to, tokenId)
                ).to.revertedWith("ERC721: transfer to the zero address");
            });

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

            it('should revoke old approval when token transfered', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = randomAddr;

                // approve
                const spender = accounts[1].address;
                await contract.connect(owner).approve(spender, tokenId);
                expect(await contract.getApproved(tokenId)).to.equal(spender); //before

                // transfer
                await contract.connect(owner).transferFrom(owner.address, to, tokenId);

                // should revoke approval
                expect(await contract.getApproved(tokenId)).to.equal(ZeroAddress); // after
            });
        });

        describe('safeTransferFrom', function () {
            // same as transferFrom
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

            // same as transferFrom
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

            // same as transferFrom
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

            it('transfer to none ERC721Receiver implementer should revert', async function () {
                // mint token first
                const tokenId = 1;
                await contract.connect(owner).mint(owner.address, tokenId); // mint to self

                const to = contractAddr; // not support ERC721Receiver
                await expect(
                    contract.connect(owner)["safeTransferFrom(address,address,uint256)"](owner.address, to, tokenId)
                ).to.revertedWith("ERC721: transfer to non ERC721Receiver implementer");
            });

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

    describe("mint", async () => {
        it('mint succeed should update balance', async function () {
            const tokenId = 1;

            await expect(
                contract.connect(owner).mint(randomAddr, tokenId)
            ).to.changeTokenBalance(contract, randomAddr, 1);
        });

        it("mint to the zero address should revert", async () => {
            const tokenId = 1;

            await expect(
                contract.connect(owner).mint(ZeroAddress, tokenId)
            ).to.be.revertedWith("ERC721: mint to the zero address");
        });

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