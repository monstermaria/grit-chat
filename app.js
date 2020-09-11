// self invoced anonymous function, hides variables and protects the application
(function () {
    // initiate variables
    let connection = null;
    let peerList = null;
    let myStream = null;
    let mediaConnection = null;
    const peerListDiv = document.querySelector(".peers");
    const video = document.querySelector(".video-container.them");

    // get user id
    const myPeerId = location.hash.slice(1);
    console.log("Connecting as " + myPeerId);

    // create new user and establish connection to server
    const peer = new Peer(myPeerId, {
        host: "glajan.com",
        port: 8443,
        path: "/myapp",
        secure: true,
        config: {
            iceServers: [
                { url: ["stun:eu-turn7.xirsys.com"] },
                {
                    username:
                        "1FOoA8xKVaXLjpEXov-qcWt37kFZol89r0FA_7Uu_bX89psvi8IjK3tmEPAHf8EeAAAAAF9NXWZnbGFqYW4=",
                    credential: "83d7389e-ebc8-11ea-a8ee-0242ac140004",
                    url: "turn:eu-turn7.xirsys.com:80?transport=udp"
                }
            ]
        }
    });

    // add a message to the messages div
    function printMessage(message, who) {
        const messagesDiv = document.querySelector(".messages");
        const messageWrapperDiv = document.createElement("div");
        const newMessageDiv = document.createElement("div");
        newMessageDiv.innerText =
            message + " | " + new Date().toLocaleTimeString();
        messageWrapperDiv.classList.add("message");
        if (who === "me") {
            messageWrapperDiv.classList.add("me");
        } else if (who === "them") {
            messageWrapperDiv.classList.add("them");
        }
        messageWrapperDiv.appendChild(newMessageDiv);
        messagesDiv.appendChild(messageWrapperDiv);
        messagesDiv.scrollTo(0, messagesDiv.scrollHeight);
    }

    // handle incoming stream
    const mediaConnOnStream = (theirStream) => {
        console.log("Incoming stream");
        const video = document.querySelector(".video-container.them video");
        video.muted = false;
        video.srcObject = theirStream;
        document
            .querySelector(".video-container.them .start")
            .classList.remove("active");
        document
            .querySelector(".video-container.them .stop")
            .classList.add("active");
    };

    // stop video click handler
    const stopVideoCall = () => {
        console.log("stopping video");
        mediaConnection && mediaConnection.close();
        const video = document.querySelector(".video-container.them");
        video.querySelector(".stop").classList.remove("active");
        video.querySelector(".start").classList.add("active");
    };

    document
        .querySelector(".video-container.them .stop")
        .addEventListener("click", stopVideoCall);

    //start video click handler
    const startVideoCall = () => {
        console.log("starting video");
        const video = document.querySelector(".video-container.them");
        // my code
        mediaConnection = peer.call(connection.peer, myStream);
        mediaConnection.on("stream", (stream) => {
            mediaConnOnStream(stream);
        });
    };

    document
        .querySelector(".video-container.them .start")
        .addEventListener("click", startVideoCall);

    // add callbacks for peer events
    peer.on("open", (id) => {
        document.querySelector(".my-peer-id").innerHTML = id;
    });
    peer.on("error", (error) => {
        console.log(error);
    });
    peer.on("connection", (newConnection) => {
        console.log("Incoming connection from " + newConnection.peer);

        // close pre-existing connection
        connection && connection.close();

        // accept the new connection
        connection = newConnection;

        // add callbacks for connection events
        connection.on("data", (data) => {
            printMessage(data, "them");
        });

        // create peer changed event and dispatch it
        const peerChangedEvent = new CustomEvent("peer-changed", {
            detail: { peerId: connection.peer }
        });
        document.dispatchEvent(peerChangedEvent);
    });
    peer.on("call", (incommingCall) => {
        // ask the user if they wants to answer the call
        if (confirm(`Answer call from ${incommingCall.peer}?`)) {
            // close pre-existing media connection
            mediaConnection && mediaConnection.close();
            // store the connection
            mediaConnection = incommingCall;
            console.log("Incoming media connection");
            console.log(mediaConnection);
            // answer with the users stream
            mediaConnection.answer(myStream);
            // handle the callers stream
            mediaConnection.on("stream", mediaConnOnStream);
        }
    });

    // callback for connect to peer
    const connectToPeerClick = (event) => {
        // extract peer id
        const peerId = event.target.innerText;

        // close pre-existing connection
        connection && connection.close();

        // get new connection
        connection = peer.connect(peerId);

        // add callbacks for connection events
        connection.on("open", () => {
            console.log("Outgoing connection to " + peerId);

            // create peer changed event and dispatch it
            const peerChangedEvent = new CustomEvent("peer-changed", {
                detail: { peerId: peerId }
            });
            document.dispatchEvent(peerChangedEvent);
        });
        connection.on("data", (data) => {
            printMessage(data, "them");
        });
    };

    // create peer list item
    function createPeerListItem(peerId) {
        // create necessary elements
        const peerItem = document.createElement("li");
        const peerButton = document.createElement("button");

        // configure button
        peerButton.innerText = peerId;
        peerButton.classList.add("connect-button");
        peerButton.classList.add(`peerId-${peerId}`);
        if (connection && connection.peer === peerId) {
            peerButton.classList.add("connected");
        }
        peerButton.addEventListener("click", connectToPeerClick);

        // add elements
        peerItem.appendChild(peerButton);
        peerList.appendChild(peerItem);
    }

    // handle user list
    const allPeersButton = document.querySelector(".list-all-peers-button");
    allPeersButton.addEventListener("click", () => {
        // remove old list(s), if any
        while (peerListDiv.hasChildNodes()) {
            peerListDiv.firstChild.remove();
        }

        // create new list
        peerList = document.createElement("ul");

        // populate new peer list (peer is the file global object)
        peer.listAllPeers((peers) => {
            // filter out own id
            const filteredPeers = peers.filter((peerId) => peerId !== myPeerId);

            // add a list item for each peer
            filteredPeers.forEach(createPeerListItem);
        });

        // append the new peerList
        peerListDiv.appendChild(peerList);
    });

    // handle "peer-changed"-event
    document.addEventListener("peer-changed", (event) => {
        const peerId = event.detail.peerId;
        document
            .querySelectorAll(".connect-button.connected")
            .forEach((button) => {
                button.classList.remove("connected");
            });
        const connectedButton = document.querySelector(`.peerId-${peerId}`);
        connectedButton && connectedButton.classList.add("connected");

        // handle video calls
        stopVideoCall();
        const video = document.querySelector(".video-container.them");
        video.querySelector(".name").innerText = peerId;
        video.classList.add("connected");
    });

    // show and store my video
    navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
            const myVideo = document.querySelector(".video-container.me video");
            myVideo.muted = true;
            myVideo.srcObject = stream;
            myStream = stream;
        });

    // send message on click on send button
    const sendButton = document.querySelector(".send-new-message-button");
    sendButton.addEventListener("click", (event) => {
        if (connection) {
            const messageInput = document.querySelector(".new-message");
            const message = messageInput.value;
            connection.send(message);
            messageInput.value = "";

            printMessage(message, "me");
        }
    });

    // implement send message on return
    const textInput = document.querySelector(".new-message");
    textInput.addEventListener("keyup", (event) => {
        if (event.keyCode === 13) {
            sendButton.click();
        }
    });
})();
