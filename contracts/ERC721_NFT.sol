// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract BaseERC721 {
    // 令所有 uint256 类型的变量都可以直接调用 'Strings' 库方法
    using Strings for uint256;
    // 所有的 address 类型变量都可以使用 'Address' 库方法
    using Address for address;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // Token baseURI
    string private _baseURI;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    /**
     * @dev 当 `tokenId` 代币从 `from` 转移到 `to` 时触发。
     */
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    /**
     * @dev 当 `owner` 授权 `approved` 管理 `tokenId` 代币时触发。
     */
    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );

    /**
     * @dev 当 `owner` 授权或取消授权 `operator` 管理其所有资产时触发。
     */
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    /**
     * @dev 初始化合约，设置代币集合的 `name`、`symbol` 和 `baseURI`。
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) {
        // 初始化合约的名称。
        _name = name_;

        // 初始化合约的符号。
        _symbol = symbol_;

        // 初始化基础URI。
        _baseURI = baseURI_;
    }

    /**
     * @dev 实现 IERC165 接口的 `supportsInterface` 方法，用于判断合约是否支持给定的接口。
     * @param interfaceId 要查询的接口ID。
     * @return 如果合约支持指定的接口，则返回 true；否则返回 false。
     */
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165 Interface ID for ERC165
            interfaceId == 0x80ac58cd || // ERC165 Interface ID for ERC721
            interfaceId == 0x5b5e139f;   // ERC165 Interface ID for ERC721Metadata
    }

    /**
     * @dev 返回 NFT 集合的名称。
     * 这个函数实现了 IERC721Metadata 接口中的 `name` 方法。
     * @return 返回一个表示 NFT 集合名称的字符串。
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev 返回 NFT 集合的符号（Symbol）。
     * 这个函数实现了 IERC721Metadata 接口中的 `symbol` 方法。
     * @return 返回一个表示 NFT 集合符号的字符串。
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev 返回指定 NFT 的元数据 URI。
     * 这个函数实现了 IERC721Metadata 接口中的 `tokenURI` 方法。
     * 元数据 URI 通常指向一个 JSON 文件，其中包含 NFT 的详细信息，如名称、描述和图像等。
     * @param tokenId 要查询的 NFT 的唯一标识符。
     * @return 返回一个表示 NFT 元数据 URI 的字符串。
     */
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        // should return baseURI
        return string(abi.encodePacked(_baseURI, tokenId.toString()));
    }

    /**
     * @dev 铸造一个新的 NFT 并将其所有权分配给指定地址。
     * 这是一个内部函数，通常由合约的其他部分调用以创建新的 NFT。
     * @param to 接收新铸造 NFT 的地址。
     * @param tokenId 新铸造 NFT 的唯一标识符。
     */
    function _mint(address to, uint256 tokenId) internal {
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev 铸造 `tokenId` 并将其转让给 `to`。
     *
     * 要求：
     *
     * - `to` 不能是零地址。
     * - `tokenId` 必须不存在。
     *
     * 触发一个 {Transfer} 事件。
     */
    function mint(address to, uint256 tokenId) public {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        // 更新接收地址的余额
        _balances[to] += 1;

        // 调用内部函数 _mint 完成代币的所有权分配
        _mint(to, tokenId);

        emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev 返回指定地址拥有的 NFT 数量。
     * 这个函数实现了 IERC721 接口中的 `balanceOf` 方法。
     * @param owner 要查询的地址。
     * @return 返回指定地址拥有的 NFT 数量。
     */
    function balanceOf(address owner) public view returns (uint256) {
        // 确保传入的地址不是零地址
        require(owner != address(0), "Invalid zero address");

        // 返回指定地址的代币余额
        return _balances[owner];
    }

    /**
     * @dev 返回指定 NFT 的所有者地址。
     * 这个函数实现了 IERC721 接口中的 `ownerOf` 方法。
     * @param tokenId 要查询的 NFT 的唯一标识符。
     * @return 返回指定 NFT 的所有者地址。
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }

    /**
     * @dev 允许指定地址操作指定的 NFT。
     * 这个函数实现了 IERC721 接口中的 `approve` 方法。
     * @param to 被授权操作 NFT 的地址。
     * @param tokenId 要授权的 NFT 的唯一标识符。
     */
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");

        require(
            msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "ERC721: approve caller is not owner nor approved for all"
        );

       _approve(to, tokenId);
    }

    /**
     * @dev 返回指定 NFT 当前被批准的操作地址。
     * 这个函数实现了 IERC721 接口中的 `getApproved` 方法。
     * @param tokenId 要查询的 NFT 的唯一标识符。
     * @return 返回指定 NFT 当前被批准的操作地址。
     */
    function getApproved(uint256 tokenId) public view returns (address) {
        require(
            _exists(tokenId),
            "ERC721: approved query for nonexistent token"
        );
        return _tokenApprovals[tokenId];
    }

    /**
     * @dev 设置一个操作员（operator）对所有 NFT 的全局批准。
     * 这个函数实现了 IERC721 接口中的 `setApprovalForAll` 方法。
     * @param operator 被授权操作所有 NFT 的地址。
     * @param approved 是否批准操作员操作所有 NFT。
     */
    function setApprovalForAll(address operator, bool approved) public {
        address sender = msg.sender;
        require(operator != sender, "ERC721: approve to caller");

        _operatorApprovals[sender][operator] = approved;

        emit ApprovalForAll(sender, operator, approved);
    }

    /**
     * @dev 检查一个操作员是否被批准操作所有 NFT。
     * 这个函数实现了 IERC721 接口中的 `isApprovedForAll` 方法。
     * @param owner NFT 所有者的地址。
     * @param operator 被检查的操作员地址。
     * @return 如果操作员被批准操作所有 NFT，则返回 true；否则返回 false。
     */
    function isApprovedForAll(
        address owner,
        address operator
    ) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    /**
     * @dev 从一个地址转移到另一个地址，要求调用者是所有者或已被批准。
     * 这个函数实现了 IERC721 接口中的 `transferFrom` 方法。
     * @param from 当前持有 NFT 的地址。
     * @param to 接收 NFT 的地址。
     * @param tokenId 要转移的 NFT 的唯一标识符。
     */
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        _transfer(from, to, tokenId);
    }

    /**
     * @dev 安全地从一个地址转移到另一个地址，要求调用者是所有者或已被批准。
     * 这个函数实现了 IERC721 接口中的 `safeTransferFrom` 方法，但不传递额外数据。
     * @param from 当前持有 NFT 的地址。
     * @param to 接收 NFT 的地址。
     * @param tokenId 要转移的 NFT 的唯一标识符。
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev 安全地从一个地址转移到另一个地址，并传递额外的数据，要求调用者是所有者或已被批准。
     * 这个函数实现了 IERC721 接口中的 `safeTransferFrom` 方法。
     * @param from 当前持有 NFT 的地址。
     * @param to 接收 NFT 的地址。
     * @param tokenId 要转移的 NFT 的唯一标识符。
     * @param _data 附加数据，可以用于接收方的处理。
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        _safeTransfer(from, to, tokenId, _data);
    }

    /**
     * @dev 安全地将 `tokenId` 代币从 `from` 转移到 `to`，首先检查接收方合约是否了解 ERC721 协议，以防止代币被永久锁定。
     *
     * `_data` 是附加数据，没有指定格式，并且会在调用 `to` 时发送。
     *
     * 这个内部函数相当于 {safeTransferFrom}，可以用于实现替代机制，例如基于签名的代币转账。
     *
     * 要求：
     *
     * - `from` 不能是零地址。
     * - `to` 不能是零地址。
     * - `tokenId` 代币必须存在并且由 `from` 拥有。
     * - 如果 `to` 是智能合约，则必须实现 {IERC721Receiver-onERC721Received}，在安全转账时会被调用。
     *
     * 触发一个 {Transfer} 事件。
     */
    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal {
        _transfer(from, to, tokenId);
        require(
            _checkOnERC721Received(from, to, tokenId, _data),
            "ERC721: transfer to non ERC721Receiver implementer"
        );
    }

    /**
     * @dev 返回 `tokenId` 是否存在。
     *
     * 代币可以由其所有者或通过 {approve} 或 {setApprovalForAll} 批准的账户进行管理。
     *
     * 代币在被铸造 (`_mint`) 时开始存在，并在被销毁 (`_burn`) 时停止存在。
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        /**code*/
        return _owners[tokenId] != address(0);
    }

    /**
     * @dev 返回 `spender` 是否被允许管理 `tokenId`。
     *
     * 要求：
     *
     * - `tokenId` 必须存在。
     */
    function _isApprovedOrOwner(
        address spender,
        uint256 tokenId
    ) internal view returns (bool) {
        require(
            _owners[tokenId] != address(0),
            "ERC721: operator query for nonexistent token"
        );
        address owner = _owners[tokenId];

        // 检查spender是否是：
        // 1. 代币的所有者
        // 2. 被批准的操作者（通过getApproved获取）
        // 3. 被所有者授权的操作者（通过isApprovedForAll获取）
        return (
            spender == owner ||          // 检查spender是否是所有者
            getApproved(tokenId) == spender || // 检查spender是否被批准为操作者
            isApprovedForAll(owner, spender)  // 检查spender是否被所有者授权为操作者
        );
    }

    /**
     * @dev 将 `tokenId` 从 `from` 转移到 `to`。
     * 与 {transferFrom} 不同，此函数不对 `msg.sender` 施加任何限制。
     *
     * 要求：
     *
     * - `to` 不能是零地址。
     * - `tokenId` 代币必须由 `from` 拥有。
     *
     * 触发一个 {Transfer} 事件。
     */
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(
           _owners[tokenId] == from,
            "ERC721: transfer from incorrect owner"
        );

        require(to != address(0), "ERC721: transfer to the zero address");

        // 清除旧的批准信息
        _approve(address(0), tokenId);

        // 更新代币的所有权。
        _owners[tokenId] = to;

        // 更新原所有者的余额。
        _balances[from] -= 1;

        // 更新新所有者的余额。
        _balances[to] += 1;

        emit Transfer(from, to, tokenId);
    }

    /**
     * @dev 授权 `to` 操作 `tokenId`。
     *
     * 触发一个 {Approval} 事件。
     */
    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    // Helper function to check if an address is a contract
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    /**
     * @dev 内部函数，用于在目标地址上调用 {IERC721Receiver-onERC721Received}。
     * 如果目标地址不是合约，则不会执行调用。
     *
     * @param from 表示给定代币 ID 的前所有者的地址
     * @param to 将接收代币的目标地址
     * @param tokenId 要转移的代币的 ID
     * @param _data 可选的附加数据，随调用一起发送
     * @return bool 调用是否正确返回了预期的魔法值
     */
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) private returns (bool) {
        if (_isContract(to)) {
            try
                IERC721Receiver(to).onERC721Received(
                    msg.sender,
                    from,
                    tokenId,
                    _data
                )
            returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert(
                        "ERC721: transfer to non ERC721Receiver implementer"
                    );
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
}

contract BaseERC721Receiver is IERC721Receiver {
    constructor() {}

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}