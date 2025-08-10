
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MLaaSPlatform {

    enum Plan { Basic, Pro, Elite }

     struct Subscription {
        Plan plan;
        uint256 expiry; // timestamp
    }

    struct Model {
        address uploader;
        uint256 creditPrice;
        string ipfsCID;
        uint256 creditsSold;
        uint256 earnings;
    }

    mapping(address => Subscription) public subscriptions;
    uint256[3] public planPrices = [0.02 ether, 0.05 ether, 0.1 ether]; // AVAX for each plan
    uint256 public constant DURATION = 30 days;

    event Subscribed(address indexed user, Plan plan, uint256 expiry);
    event PlanUpdated(Plan plan, uint256 newPrice);

    mapping(uint256 => Model) public models;
    mapping(address => mapping(uint256 => uint256)) public userCredits;
    mapping(uint256 => mapping(address => bool)) public apiKeyGenerated;
    mapping(address => bool) public backendOperators;

    mapping(address => uint256) public uploaderTotalEarnings;

    uint256 public platformFeePercent = 10;
    uint256 public modelCounter = 0;
    address public owner;

    event ModelUploaded(uint256 modelId, address indexed uploader, uint256 creditPrice, string ipfsCID);
    event CreditsPurchased(address indexed buyer, uint256 modelId, uint256 amount, uint256 credits);
    event BackendOperatorUpdated(address operator, bool status);
    event ApiKeyGenerated(uint256 modelId, address user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not platform owner");
        _;
    }

    modifier onlyBackend() {
        require(backendOperators[msg.sender], "Not authorized backend");
        _;
    }

    constructor() {
        owner = msg.sender;
        backendOperators[msg.sender] = true;
    }

    function setBackendOperator(address operator, bool status) external onlyOwner {
        backendOperators[operator] = status;
        emit BackendOperatorUpdated(operator, status);
    }

    function uploadModel(uint256 _creditPrice, string memory _ipfsCID) external payable returns (uint256) {
        require(msg.value == 0.1 ether, "Upload fee is 0.1 ETH");

        uint256 modelId = modelCounter++;
        models[modelId] = Model({
            uploader: msg.sender,
            creditPrice: _creditPrice,
            ipfsCID: _ipfsCID,
            creditsSold: 0,
            earnings: 0
        });

        payable(owner).transfer(msg.value);

        emit ModelUploaded(modelId, msg.sender, _creditPrice, _ipfsCID);
        return modelId;
    }

    function purchaseCredits(uint256 modelId, uint256 creditCount) external payable {
        Model storage model = models[modelId];
        require(model.uploader != address(0), "Model not found");

        uint256 totalCost = creditCount * model.creditPrice;
        require(msg.value >= totalCost, "Insufficient payment");

        uint256 platformFee = (totalCost * platformFeePercent) / 100;
        uint256 uploaderShare = totalCost - platformFee;

        payable(model.uploader).transfer(uploaderShare);
        payable(owner).transfer(platformFee);

        model.creditsSold += creditCount;
        model.earnings += uploaderShare;
        uploaderTotalEarnings[model.uploader] += uploaderShare;

        userCredits[msg.sender][modelId] += creditCount;

        emit CreditsPurchased(msg.sender, modelId, msg.value, creditCount);
    }

    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 25, "Max 25%");
        platformFeePercent = newFee;
    }

    function setApiKeyGenerated(uint256 modelId, address user) external onlyBackend {
        apiKeyGenerated[modelId][user] = true;
        emit ApiKeyGenerated(modelId, user);
    }

    function hasApiKey(uint256 modelId, address user) external view returns (bool) {
        return apiKeyGenerated[modelId][user];
    }

    function getCredits(address user, uint256 modelId) external view returns (uint256) {
        return userCredits[user][modelId];
    }

    function getModelStats(uint256 modelId) external view returns (
        address uploader,
        uint256 creditPrice,
        string memory ipfsCID,
        uint256 creditsSold,
        uint256 earnings
    ) {
        Model memory m = models[modelId];
        return (m.uploader, m.creditPrice, m.ipfsCID, m.creditsSold, m.earnings);
    }

    function getUploaderEarnings(address uploader) external view returns (uint256) {
        return uploaderTotalEarnings[uploader];
    }

    function getTop10Models() external view returns (uint256[10] memory topModelIds) {
        uint256[10] memory topCredits;
        for (uint256 i = 0; i < modelCounter; i++) {
            uint256 sold = models[i].creditsSold;

            for (uint256 j = 0; j < 10; j++) {
                if (sold > topCredits[j]) {
                    for (uint256 k = 9; k > j; k--) {
                        topCredits[k] = topCredits[k - 1];
                        topModelIds[k] = topModelIds[k - 1];
                    }
                    topCredits[j] = sold;
                    topModelIds[j] = i;
                    break;
                }
            }
        }
    }

    function subscribe(uint8 planId) external payable {
        require(planId < 3, "Invalid plan");
        require(msg.value == planPrices[planId], "Incorrect AVAX sent");

        Subscription storage sub = subscriptions[msg.sender];
        uint256 start = block.timestamp > sub.expiry ? block.timestamp : sub.expiry;

        sub.plan = Plan(planId);
        sub.expiry = start + DURATION;

        emit Subscribed(msg.sender, Plan(planId), sub.expiry);
    }

     /// @notice Check if a user is subscribed and active
    function isActive(address user) external view returns (bool) {
        return subscriptions[user].expiry >= block.timestamp;
    }

    /// @notice Get current subscription plan and expiry
    function getSubscription(address user) external view returns (Plan plan, uint256 expiry) {
        Subscription memory sub = subscriptions[user];
        return (sub.plan, sub.expiry);
    }

    /// @notice Get remaining subscription days
    function remainingDays(address user) external view returns (uint256) {
        if (subscriptions[user].expiry < block.timestamp) return 0;
        return (subscriptions[user].expiry - block.timestamp) / 1 days;
    }

    /// @notice Update subscription price (in AVAX)
    function updatePlanPrice(uint8 planId, uint256 newPrice) external onlyOwner {
        require(planId < 3, "Invalid plan");
        planPrices[planId] = newPrice;
        emit PlanUpdated(Plan(planId), newPrice);
    }

    /// @notice Withdraw AVAX funds
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

}
