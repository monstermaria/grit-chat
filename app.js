// self invoced anonymous function, hides variables and protects the application
(function() {
    // initiate variables
    let connection = null;

    // get user id
    const myPeerId = location.hash.slice(1);
    console.log(myPeerId);

    // create new user and establish connection to server
    let peer = new Peer(myPeerId, { 
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
                    url: "turn:eu-turn7.xirsys.com:80?transport=udp",
                },
            ],
        }
    });

    function printMessage(message, who) {
        const messagesDiv = document.querySelector(".messages");
        const messageWrapperDiv = document.createElement("div");
        const newMessageDiv = document.createElement("div");
        newMessageDiv.innerText = message + " | " + new Date().toLocaleTimeString();
        console.log(message);
        messageWrapperDiv.classList.add("message");
        if (who === "me") {
            messageWrapperDiv.classList.add("me");
            console.log("me");
        } else if (who === "them") {
            messageWrapperDiv.classList.add("them");
            console.log("them");
        }
        messageWrapperDiv.appendChild(newMessageDiv);
        messagesDiv.appendChild(messageWrapperDiv);
    }

    // add callbacks for peer events
    peer.on("open", (id) => {
        document.querySelector(".my-peer-id").innerHTML = id;
    });
    peer.on("error",  (error) => {
        console.log(error);
    });
    peer.on("connection", (newConnection) => {
        console.log("Connection established from remote peer");
        console.log(newConnection);
        // close pre-existing connection
        connection && connection.close();
        // accept the new connection
        connection = newConnection;

        // add callbacks for connection events
        connection.on("data", (data) => {
            console.log(data);
            printMessage(data, "them");
        });


        // create peer changed event and dispatch it
        const peerChangedEvent = new CustomEvent("peer-changed", {detail: {peerId: connection.peer}});
        document.dispatchEvent(peerChangedEvent);
    })

    // callback to connect to peer
    const connectToPeerClick = (event) => {
        // extract peer id
        const peerId = event.target.innerText;
        console.log(peerId);
        // close pre-existing connection
        connection && connection.close();
        // get new connection
        connection = peer.connect(peerId);
        //console.log(connection);
        connection.on("open", () => {
            console.log("Connection open");
            //console.log(connection._open);
            // create peer changed event and dispatch it
            const peerChangedEvent = new CustomEvent("peer-changed", {detail: {peerId: peerId}});
            document.dispatchEvent(peerChangedEvent);
            connection.on("data", (data) => {
                console.log(data);
                printMessage(data, "them");
            });
        });
    };


    // handle user list
    const allPeersButton = document.querySelector(".list-all-peers-button");
    allPeersButton.addEventListener("click", () => {
        const peerListDiv = document.querySelector(".peers");
        // remove old list(s), if any
        while (peerListDiv.hasChildNodes()) {
            peerListDiv.firstChild.remove();
        }
        // create new list
        const peerList = document.createElement("ul");
        // populate new peer list (peer is the file global object)
        peer.listAllPeers((peers) => {
            // filter out own id
            const filteredPeers = peers.filter((peerId) => peerId !== myPeerId);
            // add a list item for each peer
            filteredPeers.forEach((peerId) => {
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
            });
        });
        // append the new peerList
        peerListDiv.appendChild(peerList);
    }); 

    document.addEventListener("peer-changed", (event) => {
        const peerId = event.detail.peerId;
        //console.log(event);
        //console.log(peerId);
        // const connectedButtons = document.querySelectorAll(".connected");
        // console.log(connectedButtons);
        document.querySelectorAll(".connect-button.connected").forEach((button) => {
            //console.log(button.classList);
            button.classList.remove("connected");
        });
        const connectedButton = document.querySelector(`.peerId-${peerId}`);
        connectedButton && connectedButton.classList.add("connected");
    });

    const sendButton = document.querySelector(".send-new-message-button");
    sendButton.addEventListener("click", (event) => {
        console.log("send button clicked");
        if (connection) {
            const message = document.querySelector(".new-message").value;
            console.log("send " + message + " to " + connection.peer);
            connection.send(message);

            printMessage(message, "me");
        }
    })

    // implement send on return
    const textInput = document.querySelector(".new-message");
    textInput.addEventListener("keyup", (event) => {
        if (event.keyCode === 13) {
            sendButton.click();
        }
    });
})();
