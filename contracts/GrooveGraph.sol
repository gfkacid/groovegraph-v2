// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";

contract GrooveGraph is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables for Chainlink Functions
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit;

    struct Profile {
        string spotifyId;
        string[5] topArtists;    
        string[10] topTracks;    
        uint256 lastUpdated;     
        bool isVerified;         
    }

    // Mapping from address to Profile
    mapping(address => Profile) public profiles;
    
    // Mapping to track pending verifications and their associated verification IDs
    mapping(bytes32 => address) public pendingVerifications;
    mapping(bytes32 => string) public verificationIds;

    // Events
    event ProfileUpdateRequested(address indexed user, string spotifyId, string verificationId);
    event ProfileVerified(address indexed user, string spotifyId);
    event ProfileUpdated(
        address indexed user,
        string spotifyId,
        string[5] topArtists,
        string[10] topTracks
    );

    // Custom errors
    error ProfileAlreadyExists();
    error ProfileNotVerified();
    error InvalidArrayLength();

    constructor(
        address router,
        bytes32 _donId,
        uint64 _subscriptionId
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        donId = _donId;
        subscriptionId = _subscriptionId;
        gasLimit = 300000;
    }

    /**
     * @notice Initiates the profile creation process
     * @param spotifyId The Spotify ID to verify
     * @param verificationId Unique identifier to match with off-chain access token
     */
    function requestProfileCreation(
        string calldata spotifyId,
        string calldata verificationId
    ) external {
        if (profiles[msg.sender].isVerified) revert ProfileAlreadyExists();

        // Initialize a new profile
        profiles[msg.sender].spotifyId = spotifyId;
        profiles[msg.sender].lastUpdated = block.timestamp;
        
        // Prepare Chainlink Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequest(
            FunctionsRequest.Location.Inline,
            FunctionsRequest.CodeLanguage.JavaScript,
            getVerificationSource()
        );

        // Add arguments: spotify ID and verification ID
        string[] memory args = new string[](2);
        args[0] = spotifyId;
        args[1] = verificationId;
        req.setArgs(args);

        // Set the secrets configuration - this references an encrypted secrets object
        // that will be provided to the Chainlink DON
        bytes memory encryptedSecretsUrls = abi.encode("https://groovegraph.xyz/secrets"); 
        req.addSecretsReference(encryptedSecretsUrls);

        // Send the request
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        // Track the verification request and its verification ID
        pendingVerifications[requestId] = msg.sender;
        verificationIds[requestId] = verificationId;
        
        emit ProfileUpdateRequested(msg.sender, spotifyId, verificationId);
    }

    /**
     * @notice Callback function for Chainlink Functions
     * @param requestId The ID of the request
     * @param response The response from the verification
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response
    ) internal override {
        address user = pendingVerifications[requestId];
        bool isValid = abi.decode(response, (bool));

        if (isValid) {
            profiles[user].isVerified = true;
            emit ProfileVerified(user, profiles[user].spotifyId);
        }

        delete pendingVerifications[requestId];
        delete verificationIds[requestId];
    }

    /**
     * @notice Returns the source code for the Chainlink Functions verification
     * @return The source code as a string
     */
    function getVerificationSource() internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "const spotifyId = args[0];",
                "const verificationId = args[1];",
                // Get the access token from secrets using the verification ID
                "const accessToken = secrets[verificationId];",
                "if (!accessToken) { return Functions.encodeBoolean(false); }",
                // First, get the user profile to verify account ownership
                "const profileResponse = await Functions.makeHttpRequest({",
                "  url: 'https://api.spotify.com/v1/me',",
                "  headers: {",
                "    'Authorization': `Bearer ${accessToken}`",
                "  }",
                "});",
                // Check for API errors
                "if (profileResponse.error) { return Functions.encodeBoolean(false); }",
                // Verify that the profile ID matches the claimed spotifyId
                "const userSpotifyId = profileResponse.data.id;",
                "const isValid = userSpotifyId === spotifyId;",
                "return Functions.encodeBoolean(isValid);"
            )
        );
    }

    function updateProfile(
        string[5] calldata topArtists,
        string[10] calldata topTracks
    ) external {
        if (!profiles[msg.sender].isVerified) revert ProfileNotVerified();

        profiles[msg.sender].topArtists = topArtists;
        profiles[msg.sender].topTracks = topTracks;
        profiles[msg.sender].lastUpdated = block.timestamp;

        emit ProfileUpdated(
            msg.sender,
            profiles[msg.sender].spotifyId,
            topArtists,
            topTracks
        );
    }

    /**
     * @notice Retrieves a profile for a given address
     * @param user The address to look up
     * @return The profile data
     */
    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }

    /**
     * @notice Returns the source code for the Chainlink Functions verification
     * @return The source code as a string
     */
    function getVerificationSource() internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "const spotifyId = args[0];",
                "const apiResponse = await Functions.makeHttpRequest({",
                "  url: `https://api.spotify.com/v1/users/${spotifyId}`,",
                "  headers: {",
                "    'Authorization': `Bearer ${secrets.spotifyApiToken}`",
                "  }",
                "});",
                "if (apiResponse.error) { return Functions.encodeBoolean(false); }",
                "// Add verification logic here to ensure the requesting address owns the Spotify account",
                "return Functions.encodeBoolean(true);"
            )
        );
    }

    /**
     * @notice Allows the owner to update the DON ID
     * @param _donId The new DON ID
     */
    function setDonId(bytes32 _donId) external onlyOwner {
        donId = _donId;
    }

    /**
     * @notice Allows the owner to update the subscription ID
     * @param _subscriptionId The new subscription ID
     */
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    /**
     * @notice Allows the owner to update the gas limit
     * @param _gasLimit The new gas limit
     */
    function setGasLimit(uint32 _gasLimit) external onlyOwner {
        gasLimit = _gasLimit;
    }
}
